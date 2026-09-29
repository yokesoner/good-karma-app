"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { pickLevel, timesPerWeek } from "@/lib/karma";

const WEEKLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type RewardEligibilityInput = {
  id: string;
  minLevelKey: string | null;
  maxRedemptionsPerWeek: number | null;
};

// Проверки, специфичные для ОДНОЙ конкретной награды — минимальный
// уровень и как часто её можно обменивать. Не про баланс баллов: его
// проверяет отдельно resolveRewardLines в actions.ts (там же суммируется
// стоимость сразу нескольких товарных наград в одном заказе). Используется
// и для товарных наград (resolveRewardLines), и для наград-скидок
// (redeemDiscountReward ниже) — единая логика, а не две копии.
export async function checkRewardEligibility(
  userId: string,
  reward: RewardEligibilityInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (reward.minLevelKey) {
    const [levels, agg] = await Promise.all([
      db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
      db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
    ]);
    const points = agg._sum.points ?? 0;
    const currentLevel = pickLevel(points, levels);
    const currentRank = currentLevel ? levels.indexOf(currentLevel) : -1;
    const requiredRank = levels.findIndex((l) => l.key === reward.minLevelKey);
    if (requiredRank !== -1 && currentRank < requiredRank) {
      return { ok: false, error: `Доступно с уровня «${levels[requiredRank]!.name}»` };
    }
  }

  if (reward.maxRedemptionsPerWeek) {
    const since = new Date(Date.now() - WEEKLY_WINDOW_MS);
    const count = await db.karmaLedgerEntry.count({
      where: { userId, rewardId: reward.id, reason: "REWARD_REDEEMED", createdAt: { gte: since } },
    });
    if (count >= reward.maxRedemptionsPerWeek) {
      return { ok: false, error: `Эту награду можно получать не чаще ${timesPerWeek(reward.maxRedemptionsPerWeek)}` };
    }
  }

  return { ok: true };
}

const RedeemSchema = z.object({ rewardId: z.string().cuid() });

// Награда-скидка (kind = DISCOUNT) не привязана к товару — ей не на что
// быть строкой корзины, поэтому обмен происходит мгновенно здесь: баллы
// списываются сразу (как покупка подарочной карты), а не при оформлении
// заказа, в отличие от товарных наград (те остаются через корзину/чекаут,
// resolveRewardLines в actions.ts). Выдаёт KarmaDiscountGrant — снэпшот
// типа/значения скидки на момент обмена, чтобы последующее изменение или
// удаление самой награды не задело уже выданную покупателю скидку.
export async function redeemDiscountReward(input: unknown) {
  const parsed = RedeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };

  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Войдите в профиль, чтобы обменять баллы" };

  const reward = await db.karmaReward.findUnique({ where: { id: parsed.data.rewardId } });
  if (!reward || !reward.isActive || reward.kind !== "DISCOUNT" || !reward.discountType) {
    return { ok: false as const, error: "Эта награда недоступна" };
  }

  const eligibility = await checkRewardEligibility(userId, reward);
  if (!eligibility.ok) return { ok: false as const, error: eligibility.error };

  const agg = await db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } });
  const balance = agg._sum.points ?? 0;
  if (balance < reward.costPoints) {
    return { ok: false as const, error: "Недостаточно баллов для этой награды" };
  }

  await db.$transaction([
    db.karmaLedgerEntry.create({
      data: { userId, rewardId: reward.id, points: -reward.costPoints, reason: "REWARD_REDEEMED" },
    }),
    db.karmaDiscountGrant.create({
      data: {
        userId,
        rewardId: reward.id,
        discountType: reward.discountType,
        discountPct: reward.discountPct ?? 0,
        discountFixedCents: reward.discountFixedCents ?? 0,
        costPoints: reward.costPoints,
      },
    }),
  ]);

  return { ok: true as const };
}

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { karmaSnapshot } from "@/lib/karma";
import { checkRewardEligibility } from "@/server/karmaRewards";
import { normalizePhone } from "@/lib/phone";

// Страница /admin/loyalty/<code> — карта клиента для сотрудника на кассе.
// Найти её можно только через поиск по телефону (см. AdminLoyaltySearch —
// раньше был ещё QR на карте клиента, но от него отказались в пользу
// одного простого способа). loyaltyCode в URL — просто непрозрачный id,
// сам поиск и вся ветка (protected) требуют requireAdmin.

const SearchSchema = z.object({ phone: z.string().min(1) });

/**
 * Поиск клиентов по части номера телефона — живой список с аватаркой,
 * именем и телефоном, а не «найдено/не найдено» по полному номеру: на
 * кассе удобнее вводить последние цифры, которые продиктовал гость, чем
 * требовать точное совпадение. Лимит 8 — это список для клика, а не
 * полная выгрузка базы.
 */
export async function searchLoyaltyCustomers(input: unknown) {
  await requireAdmin();
  const parsed = SearchSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Введите номер телефона" };

  const digits = normalizePhone(parsed.data.phone);
  if (digits.length < 3) return { ok: true as const, results: [] };

  const users = await db.user.findMany({
    where: { phone: { contains: digits } },
    select: { name: true, phone: true, avatarUrl: true, loyaltyCode: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return { ok: true as const, results: users };
}

export async function getLoyaltyCustomer(loyaltyCode: string) {
  await requireAdmin();

  const user = await db.user.findUnique({ where: { loyaltyCode } });
  if (!user) return null;

  const [agg, levels, rewards] = await Promise.all([
    db.karmaLedgerEntry.aggregate({ where: { userId: user.id }, _sum: { points: true } }),
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaReward.findMany({
      where: { isActive: true },
      orderBy: { costPoints: "asc" },
      include: { products: { include: { product: { select: { name: true } } } } },
    }),
  ]);

  const points = agg._sum.points ?? 0;
  const snap = karmaSnapshot(points, levels, rewards);
  const eligibility = await Promise.all(rewards.map((r) => checkRewardEligibility(user.id, r)));

  const recentEntries = await db.karmaLedgerEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { reward: { select: { title: true } } },
  });

  return {
    user: { id: user.id, name: user.name, phone: user.phone, avatarUrl: user.avatarUrl },
    points,
    level: snap?.level ?? null,
    rewards: rewards.map((r, i) => ({
      id: r.id,
      title: r.title,
      costPoints: r.costPoints,
      kind: r.kind,
      productNames: r.products.map((p) => p.product.name),
      available: points >= r.costPoints && eligibility[i]!.ok,
      restrictionError: eligibility[i]!.ok ? null : eligibility[i]!.error,
    })),
    recentEntries: recentEntries.map((e) => ({
      id: e.id,
      points: e.points,
      reason: e.reason,
      rewardTitle: e.reward?.title ?? null,
      createdAt: e.createdAt,
    })),
  };
}

const RedeemSchema = z.object({ loyaltyCode: z.string().min(1), rewardId: z.string().cuid() });

/**
 * Обмен награды прямо на кассе — товар выдаётся руками, заказ в системе не
 * создаётся, только списание баллов (тот же принцип, что у
 * redeemDiscountReward в karmaRewards.ts, но инициирует не сам клиент, а
 * сотрудник со страницы карты клиента).
 */
export async function adminRedeemReward(input: unknown) {
  await requireAdmin();
  const parsed = RedeemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };

  const user = await db.user.findUnique({ where: { loyaltyCode: parsed.data.loyaltyCode }, select: { id: true } });
  if (!user) return { ok: false as const, error: "Карта не найдена" };

  const reward = await db.karmaReward.findUnique({ where: { id: parsed.data.rewardId } });
  if (!reward || !reward.isActive) return { ok: false as const, error: "Эта награда недоступна" };

  const eligibility = await checkRewardEligibility(user.id, reward);
  if (!eligibility.ok) return { ok: false as const, error: eligibility.error };

  const agg = await db.karmaLedgerEntry.aggregate({ where: { userId: user.id }, _sum: { points: true } });
  const balance = agg._sum.points ?? 0;
  if (balance < reward.costPoints) return { ok: false as const, error: "Недостаточно баллов для этой награды" };

  await db.karmaLedgerEntry.create({
    data: { userId: user.id, rewardId: reward.id, points: -reward.costPoints, reason: "REWARD_REDEEMED" },
  });

  return { ok: true as const, newBalance: balance - reward.costPoints };
}

const AdjustSchema = z.object({
  loyaltyCode: z.string().min(1),
  points: z.number().int().refine((n) => n !== 0, "Укажите число баллов, отличное от нуля").refine((n) => Math.abs(n) <= 100_000, "Слишком большое число баллов"),
  note: z.string().trim().max(200).optional(),
});

/**
 * Ручная корректировка баллов — для оплаты на кассе без онлайн-заказа
 * (клиент расплатился на месте, баллы начисляем вручную по правилу
 * "10 ₽ = 1 балл") или для исправления ошибки. reason = MANUAL_ADJUSTMENT,
 * это поле в схеме существовало и раньше именно для такого случая.
 */
export async function adminAdjustPoints(input: unknown) {
  await requireAdmin();
  const parsed = AdjustSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };

  const user = await db.user.findUnique({ where: { loyaltyCode: parsed.data.loyaltyCode }, select: { id: true } });
  if (!user) return { ok: false as const, error: "Карта не найдена" };

  if (parsed.data.points < 0) {
    const agg = await db.karmaLedgerEntry.aggregate({ where: { userId: user.id }, _sum: { points: true } });
    const balance = agg._sum.points ?? 0;
    if (balance + parsed.data.points < 0) return { ok: false as const, error: "На карте недостаточно баллов для списания" };
  }

  await db.karmaLedgerEntry.create({
    data: { userId: user.id, points: parsed.data.points, reason: "MANUAL_ADJUSTMENT" },
  });

  return { ok: true as const };
}

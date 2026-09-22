"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { pickLevel } from "@/lib/karma";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { notifyAdmins } from "@/server/adminNotify";

// Единственный источник правды "какая у уровня привилегия и включается ли
// она прямо сейчас" — раньше уровни описывались только текстом (perk),
// который ничего не проверял и не делал. Используется и живым
// предпросмотром на чекауте (quoteOrder), и оформлением заказа (placeOrder,
// см. src/server/actions.ts), поэтому вынесено в общий модуль, а не
// продублировано в обоих местах.

export type ResolvedLevelPerk =
  | { kind: "MILESTONE_GIFT"; productId: string; productName: string; everyN: number; nextOrderNumber: number }
  | { kind: "ALWAYS_DISCOUNT"; discountPct: number; levelName: string }
  | null;

/**
 * Резолвит реальную привилегию для телефона гостя — без сессии /profile:
 * баллы и уровень принадлежат User по номеру телефона (см. placeOrder),
 * это не связано со входом. Для нового номера (юзера ещё нет) — null,
 * это ожидаемо: 0 баллов = уровень Seed = нет привилегии.
 */
export async function resolveLevelPerkForPhone(phoneDigits: string | null | undefined): Promise<ResolvedLevelPerk> {
  if (!phoneDigits) return null;
  const user = await db.user.findUnique({ where: { phone: phoneDigits }, select: { id: true } });
  if (!user) return null;
  return resolveLevelPerkForUser(user.id);
}

export async function resolveLevelPerkForUser(userId: string): Promise<ResolvedLevelPerk> {
  const [levels, agg] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" }, include: { perkProduct: { select: { id: true, name: true } } } }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
  ]);
  const points = agg._sum.points ?? 0;
  const level = pickLevel(points, levels);
  if (!level) return null;

  if (level.perkKind === "ALWAYS_DISCOUNT" && level.perkDiscountPct) {
    return { kind: "ALWAYS_DISCOUNT", discountPct: level.perkDiscountPct, levelName: level.name };
  }

  if (level.perkKind === "MILESTONE_GIFT" && level.perkEveryNOrders && level.perkProduct) {
    // Считаем только неотменённые заказы — по ним и так уже не начислена
    // карма (см. AGENTS.md), привилегия уровня следует тому же правилу.
    const priorOrders = await db.order.count({ where: { userId, status: { not: "CANCELLED" } } });
    const nextOrderNumber = priorOrders + 1;
    if (nextOrderNumber % level.perkEveryNOrders === 0) {
      return {
        kind: "MILESTONE_GIFT",
        productId: level.perkProduct.id,
        productName: level.perkProduct.name,
        everyN: level.perkEveryNOrders,
        nextOrderNumber,
      };
    }
    return null;
  }

  return null;
}

// ---------- CLAIMABLE-привилегия («личный сет от шефа раз в месяц») ----------

export type ClaimablePerkStatus = {
  available: boolean;
  levelName: string;
  description: string;
  everyDays: number;
  /** Если уже заявлено в этом окне — когда снова можно. */
  nextAvailableAt: string | null;
};

/** Для профиля: можно ли прямо сейчас запросить CLAIMABLE-привилегию текущего уровня. */
export async function getClaimablePerkStatus(): Promise<ClaimablePerkStatus | null> {
  const userId = await getCurrentCustomerId();
  if (!userId) return null;

  const [levels, agg] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
  ]);
  const points = agg._sum.points ?? 0;
  const level = pickLevel(points, levels);
  if (!level || level.perkKind !== "CLAIMABLE" || !level.perkClaimEveryDays) return null;

  const lastClaim = await db.karmaPerkClaim.findFirst({
    where: { userId, levelKey: level.key },
    orderBy: { claimedAt: "desc" },
  });
  const windowMs = level.perkClaimEveryDays * 24 * 60 * 60 * 1000;
  const nextAvailableAt = lastClaim ? new Date(lastClaim.claimedAt.getTime() + windowMs) : null;
  const available = !nextAvailableAt || nextAvailableAt.getTime() <= Date.now();

  return {
    available,
    levelName: level.name,
    description: level.perkDescription ?? level.perk,
    everyDays: level.perkClaimEveryDays,
    nextAvailableAt: available ? null : nextAvailableAt!.toISOString(),
  };
}

const ClaimSchema = z.object({ note: z.string().trim().max(300).optional() });

/**
 * Заявка на CLAIMABLE-привилегию — не создаёт заказ и не списывает баллы
 * (в отличие от товарных наград за баллы, это входит в сам уровень), просто
 * фиксируется и уходит уведомлением в Telegram админам: у «личного сета от
 * шефа» нет фиксированного товара, который можно было бы выдать
 * автоматически, поэтому дальше — обычный человеческий контакт.
 */
export async function claimLevelPerk(input: unknown) {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Войдите в профиль, чтобы запросить привилегию" };
  const parsed = ClaimSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };

  const status = await getClaimablePerkStatus();
  if (!status) return { ok: false as const, error: "Эта привилегия недоступна на вашем уровне" };
  if (!status.available) {
    return { ok: false as const, error: `Уже запрошено. Следующая заявка — после ${new Date(status.nextAvailableAt!).toLocaleDateString("ru-RU")}` };
  }

  const [levels, agg, user] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, phone: true } }),
  ]);
  const level = pickLevel(agg._sum.points ?? 0, levels);
  if (!level || level.perkKind !== "CLAIMABLE") return { ok: false as const, error: "Эта привилегия недоступна на вашем уровне" };

  await db.karmaPerkClaim.create({ data: { userId, levelKey: level.key } });

  const who = user?.name ? `${user.name} (${user.phone})` : user?.phone ?? "гость";
  await notifyAdmins(
    [
      `🎁 Заявка на привилегию уровня «${level.name}»`,
      `Клиент: ${who}`,
      status.description,
      parsed.data.note ? `Комментарий: ${parsed.data.note}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return { ok: true as const };
}

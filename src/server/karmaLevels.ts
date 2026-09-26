"use server";

import { db } from "@/lib/db";
import { pickLevel } from "@/lib/karma";

// Единственный источник правды про скидку уровня: сколько процентов даёт
// текущий уровень и осталось ли у покупателя применение на этой неделе.
// Используется и живым предпросмотром на чекауте (quoteOrder), и
// оформлением заказа (placeOrder, см. src/server/actions.ts), поэтому
// вынесено в общий модуль, а не продублировано в обоих местах.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type LevelDiscount = {
  levelKey: string;
  levelName: string;
  pct: number;
  /** Сколько заказов со скидкой доступно за скользящую неделю. */
  perWeek: number;
  /** Сколько из них уже израсходовано. */
  usedThisWeek: number;
  /** Осталось применений; 0 — скидка есть, но лимит недели исчерпан. */
  left: number;
};

/**
 * Скидка уровня для пользователя. null — у текущего уровня скидки нет
 * вообще (стартовый уровень). Если скидка есть, но лимит недели исчерпан,
 * возвращаем объект с left = 0: на чекауте это надо показать текстом
 * («скидка вернётся через …»), а не молча не применить.
 */
export async function resolveLevelDiscountForUser(userId: string): Promise<LevelDiscount | null> {
  const [levels, agg] = await Promise.all([
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
  ]);

  const level = pickLevel(agg._sum.points ?? 0, levels);
  if (!level?.discountPct || !level.discountsPerWeek) return null;

  // Считаем только неотменённые заказы: отменённый заказ не должен
  // «съедать» применение скидки — по нему и карма не начисляется.
  const usedThisWeek = await db.order.count({
    where: {
      userId,
      levelDiscountPct: { not: null },
      status: { not: "CANCELLED" },
      createdAt: { gte: new Date(Date.now() - WEEK_MS) },
    },
  });

  return {
    levelKey: level.key,
    levelName: level.name,
    pct: level.discountPct,
    perWeek: level.discountsPerWeek,
    usedThisWeek,
    left: Math.max(0, level.discountsPerWeek - usedThisWeek),
  };
}

/**
 * То же самое, но по номеру телефона — для чекаута, где покупатель может
 * быть без входа в /profile: баллы и уровень принадлежат User по номеру
 * (см. placeOrder), это не связано с сессией. Для нового номера — null.
 */
export async function resolveLevelDiscountForPhone(
  phoneDigits: string | null | undefined,
): Promise<LevelDiscount | null> {
  if (!phoneDigits) return null;
  const user = await db.user.findUnique({ where: { phone: phoneDigits }, select: { id: true } });
  if (!user) return null;
  return resolveLevelDiscountForUser(user.id);
}

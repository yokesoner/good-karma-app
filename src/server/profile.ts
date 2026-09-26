"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { checkRewardEligibility } from "@/server/karmaRewards";
import { resolveLevelDiscountForUser } from "@/server/karmaLevels";

/**
 * Данные личного кабинета. Профиль — целиком клиентская страница (identity
 * живёт в localStorage только для UI-решения «показать форму входа или
 * профиль»), но userId для реальных запросов берём из подписанной cookie,
 * а не от клиента — иначе любой мог бы подставить чужой userId в devtools
 * и увидеть/списать чужие баллы.
 */
export async function getProfileData() {
  const userId = await getCurrentCustomerId();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { addresses: { orderBy: { isDefault: "desc" } } },
  });
  if (!user) return null;

  const [agg, levels, rewards, orders, discountGrants, levelDiscount] = await Promise.all([
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaReward.findMany({
      where: { isActive: true },
      orderBy: { costPoints: "asc" },
      include: {
        products: {
          include: { product: { select: { id: true, name: true, priceCents: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
        },
        minLevel: { select: { name: true } },
      },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { qty: true } } },
    }),
    // Неиспользованные персональные скидки Karma Club — выданы мгновенно
    // при обмене DISCOUNT-наград (redeemDiscountReward), ждут применения
    // на чекауте вместо промокода (см. CheckoutForm.tsx).
    db.karmaDiscountGrant.findMany({
      where: { userId, isUsed: false },
      orderBy: { createdAt: "desc" },
      include: { reward: { select: { title: true } } },
    }),
    resolveLevelDiscountForUser(userId),
  ]);

  // Уровень/недельный лимит — правило конкретной награды, не про баланс
  // (баланс уже решает доступность через data.points >= costPoints на
  // клиенте). Считаем здесь, а не в компоненте — там нет доступа к БД.
  const eligibility = await Promise.all(rewards.map((r) => checkRewardEligibility(userId, r)));

  return {
    user: { id: user.id, name: user.name ?? "", phone: user.phone, avatarUrl: user.avatarUrl },
    // Скидка текущего уровня и остаток применений на неделе — показываем
    // её в профиле тем же чипом, что и на витрине клуба.
    levelDiscount,
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line: a.line,
      flat: a.flat,
      isDefault: a.isDefault,
    })),
    points: agg._sum.points ?? 0,
    levels,
    rewards: rewards.map((r, i) => ({
      id: r.id,
      costPoints: r.costPoints,
      title: r.title,
      description: r.description,
      kind: r.kind,
      discountType: r.discountType,
      discountPct: r.discountPct,
      discountFixedCents: r.discountFixedCents,
      minLevelName: r.minLevel?.name ?? null,
      restrictionError: eligibility[i]!.ok ? null : eligibility[i]!.error,
      products: r.products.map((link) => ({
        id: link.product.id,
        name: link.product.name,
        priceCents: link.product.priceCents,
        imageUrl: link.product.images[0]?.url ?? null,
      })),
    })),
    discountGrants: discountGrants.map((g) => ({
      id: g.id,
      rewardTitle: g.reward.title,
      discountType: g.discountType,
      discountPct: g.discountPct,
      discountFixedCents: g.discountFixedCents,
      createdAt: g.createdAt,
    })),
    orders: orders.map((o) => ({
      number: o.number,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
    })),
  };
}

const AddAddressSchema = z.object({
  label: z.string().trim().min(1, "Укажите название").max(40),
  line: z.string().trim().min(3, "Укажите адрес").max(200),
  flat: z.string().trim().max(80).optional(),
});

export async function addAddress(input: unknown) {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Сессия истекла. Войдите заново" };
  const parsed = AddAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { label, line, flat } = parsed.data;
  await db.address.create({ data: { userId, label, line, flat: flat || null } });
  return { ok: true as const };
}

const RemoveAddressSchema = z.object({
  addressId: z.string().min(1),
});

export async function removeAddress(input: unknown) {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Сессия истекла. Войдите заново" };
  const parsed = RemoveAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };
  const { addressId } = parsed.data;
  // deleteMany с составным where — id ищем только среди адресов этого userId,
  // иначе по подобранному id можно было бы удалить чужой адрес.
  await db.address.deleteMany({ where: { id: addressId, userId } });
  return { ok: true as const };
}

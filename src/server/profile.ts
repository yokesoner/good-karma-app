"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentCustomerId } from "@/lib/customerAuth";

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

  const [agg, levels, rewards, redeemed, orders] = await Promise.all([
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" } }),
    db.karmaReward.findMany({ where: { isActive: true }, orderBy: { costPoints: "asc" } }),
    db.karmaLedgerEntry.findMany({
      where: { userId, reason: "REWARD_REDEEMED" },
      select: { rewardId: true },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { items: { select: { qty: true } } },
    }),
  ]);

  return {
    user: { id: user.id, name: user.name ?? "", phone: user.phone },
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line: a.line,
      flat: a.flat,
      isDefault: a.isDefault,
    })),
    points: agg._sum.points ?? 0,
    levels,
    rewards,
    claimedIds: redeemed.map((r) => r.rewardId).filter((id): id is string => !!id),
    orders: orders.map((o) => ({
      number: o.number,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
    })),
  };
}

const ClaimSchema = z.object({
  rewardId: z.string().min(1),
});

export async function claimReward(input: unknown) {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Сессия истекла. Войдите заново" };
  const parsed = ClaimSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };
  const { rewardId } = parsed.data;

  const [reward, agg] = await Promise.all([
    db.karmaReward.findUnique({ where: { id: rewardId } }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
  ]);
  if (!reward || !reward.isActive) {
    return { ok: false as const, error: "Награда сейчас недоступна" };
  }
  const balance = agg._sum.points ?? 0;
  if (balance < reward.costPoints) {
    return { ok: false as const, error: "Недостаточно баллов" };
  }

  await db.karmaLedgerEntry.create({
    data: { userId, rewardId, points: -reward.costPoints, reason: "REWARD_REDEEMED" },
  });
  return { ok: true as const };
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

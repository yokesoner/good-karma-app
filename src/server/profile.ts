"use server";

import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Данные личного кабинета. Профиль — целиком клиентская страница
 * (userId живёт в localStorage, на сервере до гидратации его не видно),
 * поэтому все данные тянутся одним экшеном, а не через серверный компонент.
 */
export async function getProfileData(userId: string) {
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
  userId: z.string().min(1),
  rewardId: z.string().min(1),
});

export async function claimReward(input: unknown) {
  const parsed = ClaimSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };
  const { userId, rewardId } = parsed.data;

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
  userId: z.string().min(1),
  label: z.string().trim().min(1, "Укажите название").max(40),
  line: z.string().trim().min(3, "Укажите адрес").max(200),
  flat: z.string().trim().max(80).optional(),
});

export async function addAddress(input: unknown) {
  const parsed = AddAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const { userId, label, line, flat } = parsed.data;
  await db.address.create({ data: { userId, label, line, flat: flat || null } });
  return { ok: true as const };
}

const RemoveAddressSchema = z.object({
  userId: z.string().min(1),
  addressId: z.string().min(1),
});

export async function removeAddress(input: unknown) {
  const parsed = RemoveAddressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Некорректные данные" };
  const { userId, addressId } = parsed.data;
  // deleteMany с составным where — id ищем только среди адресов этого userId,
  // иначе по подобранному id можно было бы удалить чужой адрес.
  await db.address.deleteMany({ where: { id: addressId, userId } });
  return { ok: true as const };
}

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getGrantedOrderNumbers, grantOrderAccess, hasOrderAccess } from "@/lib/orderAccess";
import { normalizePhone, isValidPhone } from "@/lib/phone";

const TrackSchema = z.object({
  number: z.string().trim().min(1, "Введите номер заказа").transform((v) => v.toUpperCase()),
  phone: z.string().trim().refine(isValidPhone, "Введите телефон").transform(normalizePhone),
});

// Полный телефон + точный номер заказа — уже достаточная защита от
// перебора (10+ цифр телефона), отдельный лимитер не нужен. Ошибка
// намеренно общая — не подсказывает, что именно не совпало.
export async function trackOrder(input: unknown) {
  const parsed = TrackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте номер и телефон" };
  }

  const order = await db.order.findFirst({
    where: { number: parsed.data.number, user: { phone: parsed.data.phone } },
    select: { number: true },
  });
  if (!order) {
    return { ok: false as const, error: "Не нашли заказ с таким номером и телефоном" };
  }

  await grantOrderAccess(order.number);
  return { ok: true as const, orderNumber: order.number };
}

// «Гостевой профиль» на /track: заказы, которые это устройство уже
// подтвердило (свой чекаут или ввод телефона) — без повторного ввода
// номера. Та же форма данных, что и история в /profile.
export async function getMyRecentOrders() {
  const numbers = await getGrantedOrderNumbers();
  if (numbers.length === 0) return [];

  const orders = await db.order.findMany({
    where: { number: { in: numbers } },
    include: { items: { select: { qty: true } } },
  });
  const byNumber = new Map(orders.map((o) => [o.number, o]));

  return numbers
    .map((number) => byNumber.get(number))
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .map((o) => ({
      number: o.number,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      itemsCount: o.items.reduce((s, i) => s + i.qty, 0),
    }));
}

// Питает лёгкий поллинг на /order/[number] (OrderStatusLive) — только
// статус, без остального состава заказа. Доступ проверяется той же
// подписанной cookie, что и сама страница заказа (см. hasOrderAccess),
// иначе перебором номеров можно было бы следить за чужими заказами.
export async function getOrderStatus(number: string) {
  const granted = await hasOrderAccess(number);
  if (!granted) return null;
  const order = await db.order.findUnique({
    where: { number },
    select: { status: true, fulfillment: true },
  });
  return order;
}

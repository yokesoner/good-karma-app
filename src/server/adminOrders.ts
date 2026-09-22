"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { ALLOWED_STATUSES_BY_FULFILLMENT } from "@/lib/orderLabels";

const UpdateAdminOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  paymentStatus: z.nativeEnum(PaymentStatus),
});

export type AdminOrderStatusInput = z.infer<typeof UpdateAdminOrderSchema>;

export async function updateAdminOrder(id: string, input: unknown) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  const parsed = UpdateAdminOrderSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return { ok: false as const, error: "Проверьте статусы заказа и оплаты" };
  }

  // Не доверяем клиенту, даже своей же форме: статусы доставки не имеют
  // смысла для самовывоза и наоборот (см. ALLOWED_STATUSES_BY_FULFILLMENT).
  const existing = await db.order.findUnique({ where: { id: parsedId.data }, select: { fulfillment: true } });
  if (!existing) return { ok: false as const, error: "Заказ не найден" };
  const allowed = ALLOWED_STATUSES_BY_FULFILLMENT[existing.fulfillment];
  if (!(allowed as readonly string[]).includes(parsed.data.status)) {
    return { ok: false as const, error: "Этот статус недоступен для выбранного способа получения" };
  }

  try {
    const order = await db.order.update({
      where: { id: parsedId.data },
      data: parsed.data,
      select: { number: true },
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsedId.data}`);
    revalidatePath(`/order/${order.number}`);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: "Заказ не найден" };
    }
    return { ok: false as const, error: "Не удалось сохранить статусы" };
  }
}

function refreshOrderPages(orderId: string, number: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/order/${number}`);
}

// Закрытые заказы («Выполнен», «Отменён») одной кнопкой не переоткрываем:
// если админ ошибся, это делается осознанно через форму статусов на карточке.
const FINAL_STATUSES: readonly OrderStatus[] = ["DONE", "CANCELLED"];

/**
 * Один шаг вперёд по заказу кнопкой из списка («Принять в работу»,
 * «Готов к выдаче», «Выдан клиенту»…). В отличие от updateAdminOrder не
 * трогает статус оплаты и не требует открывать форму.
 */
export async function setAdminOrderStatus(id: string, status: unknown) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  const parsedStatus = z.nativeEnum(OrderStatus).safeParse(status);
  if (!parsedId.success || !parsedStatus.success) return { ok: false as const, error: "Некорректный статус заказа" };

  const existing = await db.order.findUnique({
    where: { id: parsedId.data },
    select: { number: true, status: true, fulfillment: true },
  });
  if (!existing) return { ok: false as const, error: "Заказ не найден" };
  if (!(ALLOWED_STATUSES_BY_FULFILLMENT[existing.fulfillment] as readonly string[]).includes(parsedStatus.data)) {
    return { ok: false as const, error: "Этот статус недоступен для выбранного способа получения" };
  }
  if (FINAL_STATUSES.includes(existing.status) && existing.status !== parsedStatus.data) {
    return { ok: false as const, error: "Заказ уже закрыт — изменить статус можно на его карточке" };
  }

  try {
    await db.order.update({ where: { id: parsedId.data }, data: { status: parsedStatus.data } });
    refreshOrderPages(parsedId.data, existing.number);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось изменить статус" };
  }
}

/**
 * Админ нажал «Яндекс Доставка»: заказ уходит курьеру, статус сам становится
 * «Доставляется», а дальше покупатель сам подтверждает получение на странице
 * заказа (см. confirmOrderReceived). Сама ссылка на Яндекс открывается на
 * клиенте, здесь — только смена статуса; повторное нажатие безопасно.
 */
export async function startYandexDelivery(id: string) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: "Некорректный заказ" };

  const existing = await db.order.findUnique({
    where: { id: parsedId.data },
    select: { number: true, status: true, fulfillment: true },
  });
  if (!existing) return { ok: false as const, error: "Заказ не найден" };
  if (existing.fulfillment !== "DELIVERY") {
    return { ok: false as const, error: "Это самовывоз — курьер не нужен" };
  }
  if (existing.status === "DELIVERING") return { ok: true as const, changed: false as const };
  if (FINAL_STATUSES.includes(existing.status)) {
    return { ok: false as const, error: "Заказ уже закрыт" };
  }

  try {
    await db.order.update({ where: { id: parsedId.data }, data: { status: "DELIVERING" } });
    refreshOrderPages(parsedId.data, existing.number);
    return { ok: true as const, changed: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось отметить передачу курьеру" };
  }
}

const RECENT_ORDERS_TAKE = 20;

// Питает живую ленту уведомлений в шапке админки (AdminOrderAlerts) —
// обычный поллинг раз в несколько секунд, без SSE/WebSocket.
export async function getRecentOrdersForAdmin(sinceIso?: string) {
  await requireAdmin();
  const since = sinceIso ? new Date(sinceIso) : null;
  const orders = await db.order.findMany({
    where: since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {},
    orderBy: { createdAt: "desc" },
    take: RECENT_ORDERS_TAKE,
    select: { id: true, number: true, totalCents: true, fulfillment: true, createdAt: true },
  });
  return orders.map((order) => ({ ...order, createdAt: order.createdAt.toISOString() }));
}

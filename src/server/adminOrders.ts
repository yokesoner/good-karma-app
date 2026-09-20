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

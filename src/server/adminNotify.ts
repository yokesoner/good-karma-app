import type { Order } from "@prisma/client";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { FULFILLMENT_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orderLabels";
import { sendTelegramMessage } from "@/lib/telegram";

// Общая рассылка всем админам с привязанным Telegram — не блокирует и не
// рушит вызывающий код: каждая отправка в своём try/catch, отказ одного
// получателя не должен задевать остальных. Используется и для уведомления
// о новом заказе (notifyAdminsOfNewOrder), и для предупреждения об
// истекающей акции (src/server/promoMaintenance.ts).
export async function notifyAdmins(text: string) {
  const admins = await db.adminUser.findMany({
    where: { telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  if (admins.length === 0) return;

  await Promise.allSettled(
    admins.map(async (admin) => {
      try {
        await sendTelegramMessage(admin.telegramChatId!, text);
      } catch (error) {
        console.error("Не удалось отправить уведомление администратору в Telegram", error);
      }
    }),
  );
}

function orderMessage(order: Order) {
  const siteUrl = process.env.SITE_URL?.trim().replace(/\/$/, "");
  const lines = [
    `🆕 Новый заказ ${order.number}`,
    `Сумма: ${formatMoney(order.totalCents)}`,
    `Получение: ${FULFILLMENT_LABELS[order.fulfillment]}`,
    `Оплата: ${PAYMENT_METHOD_LABELS[order.paymentMethod]} · ${PAYMENT_STATUS_LABELS[order.paymentStatus]}`,
  ];
  if (siteUrl) lines.push(`${siteUrl}/admin/orders/${order.id}`);
  return lines.join("\n");
}

export async function notifyAdminsOfNewOrder(order: Order) {
  await notifyAdmins(orderMessage(order));
}

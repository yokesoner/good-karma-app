"use server";

import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { getBotUsername, resolveTelegramStart, sendTelegramMessage } from "@/lib/telegram";

function startPayload(adminId: string) {
  return `admin_${adminId}`;
}

export async function requestAdminTelegramLink() {
  const admin = await requireAdmin();
  const current = await db.adminUser.findUnique({ where: { id: admin.id }, select: { telegramChatId: true } });
  if (current?.telegramChatId) return { ok: true as const, linked: true as const };

  try {
    const username = await getBotUsername();
    return { ok: true as const, linked: false as const, telegramUrl: `https://t.me/${username}?start=${startPayload(admin.id)}` };
  } catch (error) {
    console.error("Не удалось получить имя Telegram-бота", error);
    return { ok: false as const, error: "Telegram сейчас недоступен. Попробуйте позже" };
  }
}

export async function confirmAdminTelegramLink() {
  const admin = await requireAdmin();

  let chatId: string | null;
  try {
    chatId = await resolveTelegramStart(startPayload(admin.id));
  } catch (error) {
    console.error("Не удалось проверить привязку Telegram админа", error);
    return { ok: false as const, error: "Не удалось проверить Telegram. Попробуйте ещё раз" };
  }
  if (!chatId) {
    return { ok: false as const, error: "Не нашли, что вы нажали Start в боте. Откройте ссылку ещё раз и подождите пару секунд" };
  }

  try {
    await db.adminUser.update({ where: { id: admin.id }, data: { telegramChatId: chatId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Этот Telegram-аккаунт уже привязан к другому администратору" };
    }
    console.error("Не удалось сохранить привязку Telegram админа", error);
    return { ok: false as const, error: "Не удалось сохранить привязку. Попробуйте ещё раз" };
  }

  try {
    await sendTelegramMessage(chatId, "✅ Уведомления Good Karma подключены. Сюда будут приходить новые заказы.");
  } catch (error) {
    console.error("Не удалось отправить подтверждение привязки Telegram", error);
  }

  return { ok: true as const };
}

export async function unlinkAdminTelegram() {
  const admin = await requireAdmin();
  await db.adminUser.update({ where: { id: admin.id }, data: { telegramChatId: null } });
  return { ok: true as const };
}

export async function getAdminTelegramStatus() {
  const admin = await requireAdmin();
  const current = await db.adminUser.findUnique({ where: { id: admin.id }, select: { telegramChatId: true } });
  return { linked: Boolean(current?.telegramChatId) };
}

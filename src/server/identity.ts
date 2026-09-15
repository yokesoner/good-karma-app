"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { getBotUsername, getTelegramUpdates, sendTelegramMessage } from "@/lib/telegram";
import { CUSTOMER_SESSION_COOKIE, customerSessionCookieOptions, signCustomerSession } from "@/lib/customerSession";

const CODE_TTL_MS = 5 * 60 * 1000;
const SEND_WINDOW_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const PhoneSchema = z.string().trim().refine(isValidPhone, "Введите телефон").transform(normalizePhone).refine(
  (phone) => /^\d{10,15}$/.test(phone),
  "Введите корректный телефон",
);
const CodeSchema = z.string().trim().regex(/^\d{4}$/, "Введите 4 цифры из SMS");

function sendLimitRetrySeconds(recent: { createdAt: Date }[], now: Date) {
  if (recent.length < MAX_SENDS_PER_WINDOW) return null;
  const retryAt = recent[recent.length - 1]!.createdAt.getTime() + SEND_WINDOW_MS;
  return Math.max(1, Math.ceil((retryAt - now.getTime()) / 1000));
}

function sendLimitError(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return { ok: false as const, error: `Слишком много запросов. Повторите через ${minutes} мин.`, retryAfterSeconds };
}

// Бот не может написать первым: пока для номера нет привязки, отправлять
// код некуда. requestLoginCode в этом случае не трогает лимиты и не создаёт
// код вообще — только отдаёт ссылку на бота, реальный код уйдёт уже из
// confirmTelegramLink после того, как человек нажмёт Start.
async function sendCodeToChat(phone: string, chatId: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - SEND_WINDOW_MS);

  try {
    // Быстрый предварительный отказ не тратит bcrypt CPU на номер, который
    // уже исчерпал лимит. Транзакция ниже повторяет проверку для защиты гонки.
    const recentBeforeHash = await db.loginCode.findMany({
      where: { phone, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
      take: MAX_SENDS_PER_WINDOW,
      select: { createdAt: true },
    });
    const preliminaryRetry = sendLimitRetrySeconds(recentBeforeHash, now);
    if (preliminaryRetry) return sendLimitError(preliminaryRetry);

    const code = randomInt(0, 10_000).toString().padStart(4, "0");
    const codeHash = await hash(code, 10);
    const created = await db.$transaction(async (tx) => {
      const recent = await tx.loginCode.findMany({
        where: { phone, createdAt: { gte: windowStart } },
        orderBy: { createdAt: "desc" },
        take: MAX_SENDS_PER_WINDOW,
        select: { createdAt: true },
      });
      const retryAfterSeconds = sendLimitRetrySeconds(recent, now);
      if (retryAfterSeconds) return { limited: true as const, retryAfterSeconds };

      // Новый код делает предыдущий невалидным, но не удаляет историю:
      // она продолжает учитываться в лимите отправок.
      await tx.loginCode.updateMany({ where: { phone, invalidatedAt: null }, data: { invalidatedAt: now } });
      const loginCode = await tx.loginCode.create({
        data: { phone, codeHash, expiresAt: new Date(now.getTime() + CODE_TTL_MS) },
        select: { id: true },
      });
      return { limited: false as const, id: loginCode.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (created.limited) return sendLimitError(created.retryAfterSeconds);

    try {
      await sendTelegramMessage(chatId, `Код входа Good Karma: ${code}. Никому его не сообщайте.`);
    } catch (error) {
      await db.loginCode.updateMany({ where: { id: created.id }, data: { invalidatedAt: new Date() } });
      console.error("Не удалось отправить код входа в Telegram", error);
      return { ok: false as const, error: "Не удалось отправить код в Telegram. Попробуйте позже" };
    }
    return { ok: true as const, retryAfterSeconds: RESEND_COOLDOWN_SECONDS };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { ok: false as const, error: "Слишком много одновременных запросов. Попробуйте ещё раз" };
    }
    console.error("Не удалось создать код входа", error);
    return { ok: false as const, error: "Не удалось отправить код. Попробуйте позже" };
  }
}

// Апдейты от Telegram — не вебхук, а обычный getUpdates: вебхуку нужен
// публичный HTTPS, которого нет ни в dev, ни пока на текущем хостинге.
// Синглтон TelegramBotState.lastUpdateId — чтобы не читать одно и то же
// сообщение повторно при следующем вызове.
async function findChatIdForPhone(phone: string): Promise<string | null> {
  const state = await db.telegramBotState.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  const updates = await getTelegramUpdates(state.lastUpdateId);

  let maxSeen = state.lastUpdateId;
  let chatId: string | null = null;
  for (const update of updates) {
    maxSeen = Math.max(maxSeen, update.update_id + 1);
    const text = update.message?.text?.trim() ?? "";
    const match = /^\/start\s+(\S+)$/.exec(text);
    if (match?.[1] === phone && update.message) {
      chatId = String(update.message.chat.id);
    }
  }
  if (maxSeen > state.lastUpdateId) {
    await db.telegramBotState.update({ where: { id: "singleton" }, data: { lastUpdateId: maxSeen } });
  }
  return chatId;
}

export async function requestLoginCode(input: unknown) {
  const parsed = PhoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Введите телефон" };
  const phone = parsed.data;

  const link = await db.telegramLink.findUnique({ where: { phone } });
  if (link) return sendCodeToChat(phone, link.chatId);

  try {
    const username = await getBotUsername();
    return { ok: true as const, needsTelegramLink: true as const, telegramUrl: `https://t.me/${username}?start=${phone}` };
  } catch (error) {
    console.error("Не удалось получить имя Telegram-бота", error);
    return { ok: false as const, error: "Вход через Telegram сейчас недоступен. Попробуйте позже" };
  }
}

export async function confirmTelegramLink(phoneInput: unknown) {
  const phone = PhoneSchema.safeParse(phoneInput);
  if (!phone.success) return { ok: false as const, error: phone.error.issues[0]?.message ?? "Введите телефон" };

  const existing = await db.telegramLink.findUnique({ where: { phone: phone.data } });
  let chatId = existing?.chatId ?? null;
  if (!chatId) {
    try {
      chatId = await findChatIdForPhone(phone.data);
    } catch (error) {
      console.error("Не удалось проверить привязку Telegram", error);
      return { ok: false as const, error: "Не удалось проверить Telegram. Попробуйте ещё раз" };
    }
    if (!chatId) {
      return { ok: false as const, error: "Не нашли, что вы нажали Start в боте. Откройте ссылку ещё раз и подождите пару секунд" };
    }
    await db.telegramLink.create({ data: { phone: phone.data, chatId } });
  }
  return sendCodeToChat(phone.data, chatId);
}

export async function verifyLoginCode(phoneInput: unknown, codeInput: unknown) {
  const phone = PhoneSchema.safeParse(phoneInput);
  const code = CodeSchema.safeParse(codeInput);
  if (!phone.success) return { ok: false as const, error: phone.error.issues[0]?.message ?? "Введите телефон" };
  if (!code.success) return { ok: false as const, error: code.error.issues[0]?.message ?? "Введите код" };

  const loginCode = await db.loginCode.findFirst({
    where: { phone: phone.data, invalidatedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!loginCode) return { ok: false as const, error: "Запросите новый код" };
  if (loginCode.expiresAt <= new Date()) return { ok: false as const, error: "Код истёк. Запросите новый" };
  if (loginCode.attempts >= MAX_CODE_ATTEMPTS) return { ok: false as const, error: "Слишком много попыток. Запросите новый код" };

  const matches = await compare(code.data, loginCode.codeHash);
  if (!matches) {
    const updated = await db.loginCode.updateMany({
      where: { id: loginCode.id, invalidatedAt: null, attempts: { lt: MAX_CODE_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (!updated.count || loginCode.attempts + 1 >= MAX_CODE_ATTEMPTS) {
      return { ok: false as const, error: "Слишком много попыток. Запросите новый код" };
    }
    return { ok: false as const, error: "Неверный код" };
  }

  try {
    const user = await db.$transaction(async (tx) => {
      // Условное обновление делает код одноразовым даже при двух параллельных
      // успешных запросах: только один из них получит count = 1.
      const consumed = await tx.loginCode.updateMany({
        where: { id: loginCode.id, invalidatedAt: null, attempts: { lt: MAX_CODE_ATTEMPTS }, expiresAt: { gt: new Date() } },
        data: { invalidatedAt: new Date() },
      });
      if (consumed.count !== 1) return null;
      return tx.user.upsert({ where: { phone: phone.data }, update: {}, create: { phone: phone.data } });
    });
    if (!user) return { ok: false as const, error: "Код уже использован. Запросите новый" };

    // SMS подтвердила владение номером только в этот момент — без подписанной
    // cookie дальнейшие действия в профиле принимали бы userId от клиента
    // как есть, и его можно было бы просто подставить в devtools.
    const token = await signCustomerSession({ userId: user.id });
    cookies().set(CUSTOMER_SESSION_COOKIE, token, customerSessionCookieOptions);

    return { ok: true as const, userId: user.id, name: user.name ?? "", phone: user.phone };
  } catch (error) {
    console.error("Не удалось подтвердить код входа", error);
    return { ok: false as const, error: "Не удалось войти. Попробуйте позже" };
  }
}

export async function logoutCustomer() {
  cookies().set(CUSTOMER_SESSION_COOKIE, "", { ...customerSessionCookieOptions, maxAge: 0 });
}

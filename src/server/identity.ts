"use server";

import { randomInt } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { sendLoginCodeSms } from "@/lib/sms";

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

export async function requestLoginCode(input: unknown) {
  const parsed = PhoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Введите телефон" };

  const phone = parsed.data;
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
      await sendLoginCodeSms(phone, code);
    } catch (error) {
      await db.loginCode.updateMany({ where: { id: created.id }, data: { invalidatedAt: new Date() } });
      console.error("Не удалось отправить код входа", error);
      return { ok: false as const, error: "Не удалось отправить SMS. Попробуйте позже" };
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
    return { ok: true as const, userId: user.id, name: user.name ?? "", phone: user.phone };
  } catch (error) {
    console.error("Не удалось подтвердить код входа", error);
    return { ok: false as const, error: "Не удалось войти. Попробуйте позже" };
  }
}

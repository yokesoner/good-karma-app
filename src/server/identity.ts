"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone, isValidPhone } from "@/lib/phone";

const PhoneSchema = z.string().trim().refine(isValidPhone, "Укажите телефон");

/**
 * «Вход» без пароля и SMS-кода — тот же upsert по телефону, что уже
 * делает placeOrder при оформлении заказа. Не путать с настоящей
 * авторизацией: любой, кто знает номер телефона, может так «войти».
 */
export async function resolveIdentity(input: unknown) {
  const parsed = PhoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Введите телефон" };
  }
  const phone = normalizePhone(parsed.data);
  const user = await db.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });
  return { ok: true as const, userId: user.id, name: user.name ?? "", phone: user.phone };
}

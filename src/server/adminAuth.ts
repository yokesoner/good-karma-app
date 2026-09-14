"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  signAdminSession,
} from "@/lib/adminSession";

const LoginSchema = z.object({
  email: z.string().trim().email("Введите корректный email").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Введите пароль"),
});

export async function loginAdmin(input: unknown) {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  const valid = admin ? await compare(parsed.data.password, admin.passwordHash) : false;
  if (!admin || !valid) {
    return { ok: false as const, error: "Неверный email или пароль" };
  }

  try {
    const token = await signAdminSession({ id: admin.id, email: admin.email, name: admin.name });
    await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    cookies().set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось создать административную сессию" };
  }
}

export async function logoutAdmin() {
  cookies().set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions,
    maxAge: 0,
  });
}

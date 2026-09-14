"use server";

import { hash } from "bcryptjs";
import { AdminRole, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const CreateAdminSchema = z.object({
  email: z.string().trim().email("Введите корректный email").transform((value) => value.toLowerCase()),
  password: z.string().min(10, "Пароль должен содержать не менее 10 символов").max(200),
  name: z.string().trim().min(1, "Укажите имя").max(80),
  role: z.nativeEnum(AdminRole),
});

// Владелец не может остаться без единого OWNER — иначе управлять
// командой станет некому. Считаем OWNER-ов, не считая того, кого меняем.
async function ownerCountExcluding(id: string) {
  return db.adminUser.count({ where: { role: "OWNER", id: { not: id } } });
}

export async function createAdminTeamMember(input: unknown) {
  await requireOwner();
  const parsed = CreateAdminSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    const passwordHash = await hash(parsed.data.password, 12);
    await db.adminUser.create({
      data: { email: parsed.data.email, passwordHash, name: parsed.data.name, role: parsed.data.role },
    });
    revalidatePath("/admin/team");
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Администратор с таким email уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать администратора" };
  }
}

export async function updateAdminRole(id: string, role: unknown) {
  await requireOwner();
  const parsedId = z.string().cuid().safeParse(id);
  const parsedRole = z.nativeEnum(AdminRole).safeParse(role);
  if (!parsedId.success || !parsedRole.success) {
    return { ok: false as const, error: "Некорректные данные" };
  }
  if (parsedRole.data !== "OWNER" && (await ownerCountExcluding(parsedId.data)) === 0) {
    return { ok: false as const, error: "Нельзя оставить админку без единого владельца" };
  }
  try {
    await db.adminUser.update({ where: { id: parsedId.data }, data: { role: parsedRole.data } });
    revalidatePath("/admin/team");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось изменить роль" };
  }
}

export async function deleteAdminTeamMember(id: string) {
  const current = await requireOwner();
  const parsed = z.string().cuid().safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID" };
  if (parsed.data === current.id) {
    return { ok: false as const, error: "Нельзя удалить свою же учётную запись" };
  }
  const target = await db.adminUser.findUnique({ where: { id: parsed.data }, select: { role: true } });
  if (target?.role === "OWNER" && (await ownerCountExcluding(parsed.data)) === 0) {
    return { ok: false as const, error: "Нельзя удалить последнего владельца" };
  }
  try {
    await db.adminUser.delete({ where: { id: parsed.data } });
    revalidatePath("/admin/team");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить администратора" };
  }
}

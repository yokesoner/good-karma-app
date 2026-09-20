"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { imageUrlSchema } from "@/lib/imageUrlSchema";

const IdSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID: только латиница, цифры и дефисы");

const WokIngredientSchema = z.object({
  id: IdSchema,
  name: z.string().trim().min(1, "Укажите название").max(80),
  extraCents: z.number().int().min(0).max(10_000_000),
  imageUrl: imageUrlSchema().nullable(),
});

const WokSauceSchema = WokIngredientSchema.extend({
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Цвет в формате #RRGGBB"),
});

export type AdminWokIngredientInput = z.infer<typeof WokIngredientSchema>;
export type AdminWokSauceInput = z.infer<typeof WokSauceSchema>;

function refreshWokPages() {
  revalidatePath("/");
  revalidatePath("/wok-builder");
  revalidatePath("/admin/wok-builder");
}

export async function createAdminWokBase(input: unknown) {
  await requireAdmin();
  const parsed = WokIngredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.wokBase.create({ data: parsed.data });
    refreshWokPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Основа с таким ID уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать основу" };
  }
}

export async function updateAdminWokBase(id: string, input: unknown) {
  await requireAdmin();
  const parsed = WokIngredientSchema.safeParse(input);
  if (!parsed.success || parsed.data.id !== id) {
    return { ok: false as const, error: parsed.success ? "ID нельзя менять" : parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  try {
    await db.wokBase.update({ where: { id }, data: { name: parsed.data.name, extraCents: parsed.data.extraCents, imageUrl: parsed.data.imageUrl } });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить основу" };
  }
}

export async function deleteAdminWokBase(id: string) {
  await requireAdmin();
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID" };
  try {
    await db.wokBase.delete({ where: { id } });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить основу" };
  }
}

export async function createAdminWokProtein(input: unknown) {
  await requireAdmin();
  const parsed = WokIngredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.wokProtein.create({ data: parsed.data });
    refreshWokPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Начинка с таким ID уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать начинку" };
  }
}

export async function updateAdminWokProtein(id: string, input: unknown) {
  await requireAdmin();
  const parsed = WokIngredientSchema.safeParse(input);
  if (!parsed.success || parsed.data.id !== id) {
    return { ok: false as const, error: parsed.success ? "ID нельзя менять" : parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  try {
    await db.wokProtein.update({ where: { id }, data: { name: parsed.data.name, extraCents: parsed.data.extraCents, imageUrl: parsed.data.imageUrl } });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить начинку" };
  }
}

export async function deleteAdminWokProtein(id: string) {
  await requireAdmin();
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID" };
  try {
    await db.wokProtein.delete({ where: { id } });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить начинку" };
  }
}

export async function createAdminWokSauce(input: unknown) {
  await requireAdmin();
  const parsed = WokSauceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.wokSauce.create({ data: parsed.data });
    refreshWokPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Соус с таким ID уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать соус" };
  }
}

export async function updateAdminWokSauce(id: string, input: unknown) {
  await requireAdmin();
  const parsed = WokSauceSchema.safeParse(input);
  if (!parsed.success || parsed.data.id !== id) {
    return { ok: false as const, error: parsed.success ? "ID нельзя менять" : parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  try {
    await db.wokSauce.update({
      where: { id },
      data: { name: parsed.data.name, extraCents: parsed.data.extraCents, colorHex: parsed.data.colorHex, imageUrl: parsed.data.imageUrl },
    });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить соус" };
  }
}

export async function deleteAdminWokSauce(id: string) {
  await requireAdmin();
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID" };
  try {
    await db.wokSauce.delete({ where: { id } });
    refreshWokPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить соус" };
  }
}

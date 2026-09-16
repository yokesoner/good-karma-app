"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const CategorySchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID: только латиница, цифры и дефисы"),
  name: z.string().trim().min(1, "Укажите название").max(80),
  sortOrder: z.number().int().min(-1000).max(1000),
  theme: z.string().trim().min(1, "Укажите тему").max(40),
  accentTint: z.string().trim().min(1, "Укажите акцент").max(40),
  pattern: z.string().trim().min(1, "Укажите паттерн").max(40),
  jpTagline: z.string().trim().max(80).nullable(),
  tagline: z.string().trim().max(160).nullable(),
  imageUrl: z.string().trim().url().max(500).nullable(),
});

export type AdminCategoryInput = z.infer<typeof CategorySchema>;

function refreshCategoryPages(id: string) {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath(`/menu/${id}`);
  revalidatePath("/admin/categories");
}

export async function createAdminCategory(input: unknown) {
  await requireAdmin();
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  const { theme, accentTint, pattern, jpTagline, tagline, imageUrl, ...category } = parsed.data;
  try {
    await db.category.create({
      data: {
        ...category,
        meta: { create: { theme, accentTint, pattern, jpTagline, tagline, imageUrl } },
      },
    });
    refreshCategoryPages(category.id);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Категория с таким ID уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать категорию" };
  }
}

export async function updateAdminCategory(id: string, input: unknown) {
  await requireAdmin();
  const parsedId = z.string().min(1).max(40).safeParse(id);
  const parsed = CategorySchema.safeParse(input);
  if (!parsedId.success || !parsed.success || parsed.data.id !== id) {
    return { ok: false as const, error: "Некорректные данные категории" };
  }
  const { theme, accentTint, pattern, jpTagline, tagline, imageUrl, ...category } = parsed.data;
  try {
    await db.category.update({
      where: { id },
      data: {
        name: category.name,
        sortOrder: category.sortOrder,
        meta: {
          upsert: {
            create: { theme, accentTint, pattern, jpTagline, tagline, imageUrl },
            update: { theme, accentTint, pattern, jpTagline, tagline, imageUrl },
          },
        },
      },
    });
    refreshCategoryPages(id);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить категорию" };
  }
}

export async function deleteAdminCategory(id: string) {
  await requireAdmin();
  const parsed = z.string().min(1).max(40).safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID категории" };
  try {
    await db.category.delete({ where: { id } });
    refreshCategoryPages(id);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Нельзя удалить категорию, пока к ней привязаны товары" };
    }
    return { ok: false as const, error: "Не удалось удалить категорию" };
  }
}

"use server";

import { Badge, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { imageUrlSchema } from "@/lib/imageUrlSchema";

const ImageSchema = z.object({
  url: imageUrlSchema({ maxLength: 2048, requiredMessage: "Укажите URL изображения" }),
  alt: z.string().trim().max(160, "Alt-текст должен быть не длиннее 160 символов"),
  sortOrder: z.number().int().min(0).max(1000),
});

const AdminProductSchema = z.object({
  slug: z.string().trim().min(1, "Укажите slug").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: только латиница, цифры и дефисы"),
  name: z.string().trim().min(1, "Укажите название").max(80),
  description: z.string().trim().min(1, "Укажите описание").max(600),
  weight: z.string().trim().min(1, "Укажите вес или объём").max(40),
  priceCents: z.number().int().min(0).max(10_000_000),
  karma: z.number().int().min(0).max(10_000_000),
  badge: z.enum(["HIT", "NEW"]).nullable(),
  categoryId: z.string().trim().min(1, "Выберите категорию"),
  isStopList: z.boolean(),
  isHidden: z.boolean(),
  images: z.array(ImageSchema).max(20, "Можно добавить не больше 20 изображений"),
});

export type AdminProductInput = z.infer<typeof AdminProductSchema>;

function validationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Проверьте поля формы";
}

function databaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "Такой slug уже занят";
    if (error.code === "P2003") return "Выбранная категория не существует";
  }
  return "Не удалось сохранить товар";
}

export async function createAdminProduct(input: unknown) {
  await requireAdmin();
  const parsed = AdminProductSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: validationError(parsed.error) };

  const { images, badge, ...product } = parsed.data;
  try {
    const created = await db.product.create({
      data: {
        ...product,
        badge: badge ? Badge[badge] : null,
        images: { create: images },
      },
      select: { id: true },
    });
    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/admin/products");
    return { ok: true as const, id: created.id };
  } catch (error) {
    return { ok: false as const, error: databaseError(error) };
  }
}

export async function updateAdminProduct(id: string, input: unknown) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  const parsed = AdminProductSchema.safeParse(input);
  if (!parsedId.success) return { ok: false as const, error: "Некорректный идентификатор товара" };
  if (!parsed.success) return { ok: false as const, error: validationError(parsed.error) };

  const { images, badge, ...product } = parsed.data;
  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { ...product, badge: badge ? Badge[badge] : null },
      });
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image) => ({ ...image, productId: id })),
        });
      }
    });
    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath(`/product/${parsed.data.slug}`);
    revalidatePath("/admin/products");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: databaseError(error) };
  }
}

export async function deleteAdminProduct(id: string) {
  await requireAdmin();
  const parsed = z.string().cuid().safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный идентификатор товара" };

  try {
    await db.product.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/admin/products");
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Товар уже встречается в заказах — вместо удаления скройте его" };
    }
    return { ok: false as const, error: "Не удалось удалить товар" };
  }
}

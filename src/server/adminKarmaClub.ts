"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const KarmaLevelSchema = z.object({
  key: z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Ключ: только латиница, цифры и дефисы"),
  name: z.string().trim().min(1).max(80),
  fromKarma: z.number().int().min(0).max(10_000_000),
  toKarma: z.number().int().min(1).max(10_000_001),
  icon: z.string().trim().min(1).max(40),
  perk: z.string().trim().min(1).max(300),
}).refine((value) => value.toKarma > value.fromKarma, {
  path: ["toKarma"],
  message: "Верхняя граница должна быть больше нижней",
});

const KarmaRewardSchema = z.object({
  costPoints: z.number().int().min(0).max(10_000_000),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(400),
  isActive: z.boolean(),
  kind: z.enum(["PRODUCT", "DISCOUNT"]),
  // Товар(ы), которые покупатель получает в обмен на эту награду — при
  // нескольких он выбирает один в /profile. Только для kind = PRODUCT.
  // Без единого товара награду обменять на сайте нельзя (см. RewardsSection).
  productIds: z.array(z.string()).max(20),
  // Только для kind = DISCOUNT — тот же паттерн, что у Promotion
  // (type/discountPct/discountFixedCents), см. computeDiscountCents в
  // src/server/pricing.ts.
  discountType: z.enum(["PERCENT", "FIXED"]).nullable(),
  discountPct: z.number().int().min(0).max(100).nullable(),
  discountFixedCents: z.number().int().min(0).max(100_000_000).nullable(),
  // null = без ограничения уровнем/частотой.
  minLevelKey: z.string().nullable(),
  maxRedemptionsPerWeek: z.number().int().min(1).max(1000).nullable(),
}).superRefine((value, ctx) => {
  if (value.kind === "DISCOUNT" && !value.discountType) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["discountType"], message: "Укажите тип скидки" });
  }
});

export type AdminKarmaLevelInput = z.infer<typeof KarmaLevelSchema>;
export type AdminKarmaRewardInput = z.infer<typeof KarmaRewardSchema>;

function refreshKarmaPages() {
  revalidatePath("/promotions");
  revalidatePath("/karma-club");
  revalidatePath("/profile");
  revalidatePath("/admin/karma-club");
}

export async function createAdminKarmaLevel(input: unknown) {
  await requireAdmin();
  const parsed = KarmaLevelSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.karmaLevel.create({ data: parsed.data });
    refreshKarmaPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Уровень с таким ключом уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать уровень" };
  }
}

export async function updateAdminKarmaLevel(key: string, input: unknown) {
  await requireAdmin();
  const parsed = KarmaLevelSchema.safeParse(input);
  if (!parsed.success || parsed.data.key !== key) return { ok: false as const, error: parsed.success ? "Ключ уровня нельзя менять" : parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.karmaLevel.update({
      where: { key },
      data: {
        name: parsed.data.name,
        fromKarma: parsed.data.fromKarma,
        toKarma: parsed.data.toKarma,
        icon: parsed.data.icon,
        perk: parsed.data.perk,
      },
    });
    refreshKarmaPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить уровень" };
  }
}

export async function deleteAdminKarmaLevel(key: string) {
  await requireAdmin();
  const parsed = z.string().min(1).max(40).safeParse(key);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ключ уровня" };
  try {
    await db.karmaLevel.delete({ where: { key } });
    refreshKarmaPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить уровень" };
  }
}

async function minLevelExists(key: string | null) {
  if (!key) return true;
  return Boolean(await db.karmaLevel.findUnique({ where: { key }, select: { key: true } }));
}

export async function createAdminKarmaReward(input: unknown) {
  await requireAdmin();
  const parsed = KarmaRewardSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  if (!(await minLevelExists(parsed.data.minLevelKey))) {
    return { ok: false as const, error: "Выбранный уровень не существует" };
  }
  // Скидке не на что быть товарной строкой — обмен kind=DISCOUNT минует
  // корзину полностью (см. redeemDiscountReward), поэтому и привязывать
  // к ней товары незачем, даже если форма прислала их по ошибке.
  const productIds = parsed.data.kind === "DISCOUNT" ? [] : parsed.data.productIds;
  const { productIds: _productIds, ...rest } = parsed.data;
  try {
    await db.karmaReward.create({
      data: { ...rest, products: { create: productIds.map((productId) => ({ productId })) } },
    });
    refreshKarmaPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось создать награду" };
  }
}

export async function updateAdminKarmaReward(id: string, input: unknown) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  const parsed = KarmaRewardSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false as const, error: parsed.success ? "Некорректный ID награды" : parsed.error.issues[0]?.message ?? "Проверьте поля" };
  if (!(await minLevelExists(parsed.data.minLevelKey))) {
    return { ok: false as const, error: "Выбранный уровень не существует" };
  }
  const productIds = parsed.data.kind === "DISCOUNT" ? [] : parsed.data.productIds;
  const { productIds: _productIds, ...rest } = parsed.data;
  try {
    // deleteMany + create в одном nested write — весь набор товаров
    // перезаписывается атомарно, без ручной транзакции.
    await db.karmaReward.update({
      where: { id },
      data: { ...rest, products: { deleteMany: {}, create: productIds.map((productId) => ({ productId })) } },
    });
    refreshKarmaPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить награду" };
  }
}

export async function deleteAdminKarmaReward(id: string) {
  await requireAdmin();
  const parsed = z.string().cuid().safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Некорректный ID награды" };
  try {
    await db.karmaReward.delete({ where: { id } });
    refreshKarmaPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Награда уже встречается в истории списаний — отключите её вместо удаления" };
    }
    return { ok: false as const, error: "Не удалось удалить награду" };
  }
}

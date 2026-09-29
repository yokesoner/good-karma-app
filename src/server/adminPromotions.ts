"use server";

import { Prisma, PromoType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { imageUrlSchema } from "@/lib/imageUrlSchema";
import { PROMO_BACKGROUND_KEYS } from "@/lib/promoBackgrounds";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const PromotionSchema = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[A-Z0-9_-]+$/, "Код: заглавная латиница, цифры, _ и -"),
  type: z.enum(["PERCENT", "FIXED"]),
  discountPct: z.number().int().min(0).max(100),
  // Только для type = FIXED — см. комментарий в prisma/schema.prisma и
  // computeDiscountCents в src/server/pricing.ts.
  discountFixedCents: z.number().int().min(0).max(100_000_000),
  minOrderCents: z.number().int().min(0).max(100_000_000),
  title: z.string().trim().min(1, "Укажите название").max(120),
  description: z.string().trim().min(1, "Укажите описание").max(600),
  activeFrom: z.string().datetime().nullable(),
  activeTo: z.string().datetime().nullable(),
  isActive: z.boolean(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]),
  recurrenceStartTime: z.string().regex(TIME_REGEX, "Время в формате ЧЧ:ММ").nullable(),
  recurrenceEndTime: z.string().regex(TIME_REGEX, "Время в формате ЧЧ:ММ").nullable(),
  recurrenceWeekdays: z.array(z.number().int().min(0).max(6)).max(7),
  recurrenceDayOfMonth: z.number().int().min(1).max(31).nullable(),
  featuredImageProductId: z.string().cuid().nullable(),
  // Своя картинка приоритетнее featuredImageProductId — это путь с диска
  // сервера или HTTPS-ссылка, а не строгий cuid, поэтому отдельная, более
  // мягкая валидация (см. imageUrlSchema).
  imageUrl: imageUrlSchema().nullable(),
  backgroundKey: z.enum(PROMO_BACKGROUND_KEYS).nullable(),
  // Метка на витрине — короткая, чтобы влезать в чип на слайде карусели.
  label: z.string().trim().max(32, "Метка — не длиннее 32 символов").nullable(),
  showOnHome: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
}).superRefine((value, ctx) => {
  if (value.activeFrom && value.activeTo && value.activeTo <= value.activeFrom) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activeTo"], message: "Дата окончания должна быть позже даты начала" });
  }
  if (value.recurrence !== "NONE" && (!value.recurrenceStartTime || !value.recurrenceEndTime)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrenceStartTime"], message: "Укажите время начала и окончания окна" });
  }
  if (value.recurrence === "WEEKLY" && value.recurrenceWeekdays.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrenceWeekdays"], message: "Выберите хотя бы один день недели" });
  }
  if (value.recurrence === "MONTHLY" && !value.recurrenceDayOfMonth) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["recurrenceDayOfMonth"], message: "Укажите число месяца" });
  }
});

export type AdminPromotionInput = z.infer<typeof PromotionSchema>;

function refreshPromotionPages() {
  revalidatePath("/");
  revalidatePath("/promotions");
  revalidatePath("/admin/promotions");
}

function promotionData(input: AdminPromotionInput) {
  return {
    type: PromoType[input.type],
    discountPct: input.discountPct,
    discountFixedCents: input.discountFixedCents,
    minOrderCents: input.minOrderCents,
    title: input.title,
    description: input.description,
    activeFrom: input.activeFrom ? new Date(input.activeFrom) : null,
    activeTo: input.activeTo ? new Date(input.activeTo) : null,
    isActive: input.isActive,
    recurrence: input.recurrence,
    recurrenceStartTime: input.recurrence === "NONE" ? null : input.recurrenceStartTime,
    recurrenceEndTime: input.recurrence === "NONE" ? null : input.recurrenceEndTime,
    recurrenceWeekdays: input.recurrence === "WEEKLY" ? input.recurrenceWeekdays : [],
    recurrenceDayOfMonth: input.recurrence === "MONTHLY" ? input.recurrenceDayOfMonth : null,
    featuredImageProductId: input.featuredImageProductId,
    imageUrl: input.imageUrl,
    backgroundKey: input.backgroundKey,
    label: input.label || null,
    showOnHome: input.showOnHome,
    sortOrder: input.sortOrder,
    // Любое сохранение (создание или правка) — это и есть "продлил
    // акцию" с точки зрения администратора, так что предупреждение об
    // истечении должно смочь прийти снова.
    expiryWarnedAt: null,
  };
}

async function featuredProductExists(productId: string | null) {
  if (!productId) return true;
  return Boolean(await db.product.findUnique({ where: { id: productId }, select: { id: true } }));
}

export async function createAdminPromotion(input: unknown) {
  await requireAdmin();
  const parsed = PromotionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  if (!(await featuredProductExists(parsed.data.featuredImageProductId))) {
    return { ok: false as const, error: "Выбранный товар не существует" };
  }
  try {
    await db.promotion.create({ data: { code: parsed.data.code, ...promotionData(parsed.data) } });
    refreshPromotionPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { ok: false as const, error: "Акция с таким кодом уже существует" };
      if (error.code === "P2003") return { ok: false as const, error: "Выбранный товар не существует" };
    }
    return { ok: false as const, error: "Не удалось создать акцию" };
  }
}

export async function updateAdminPromotion(code: string, input: unknown) {
  await requireAdmin();
  const parsed = PromotionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  if (parsed.data.code !== code) {
    return { ok: false as const, error: "Код акции нельзя изменить" };
  }
  if (!(await featuredProductExists(parsed.data.featuredImageProductId))) {
    return { ok: false as const, error: "Выбранный товар не существует" };
  }
  try {
    await db.promotion.update({ where: { code }, data: promotionData(parsed.data) });
    refreshPromotionPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Выбранный товар не существует" };
    }
    return { ok: false as const, error: "Не удалось сохранить акцию" };
  }
}

export async function deleteAdminPromotion(code: string) {
  await requireAdmin();
  const parsed = z.string().min(1).max(40).safeParse(code);
  if (!parsed.success) return { ok: false as const, error: "Некорректный код акции" };
  try {
    await db.promotion.delete({ where: { code } });
    refreshPromotionPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false as const, error: "Акция уже использована в заказах и не может быть удалена" };
    }
    return { ok: false as const, error: "Не удалось удалить акцию" };
  }
}

const PromoHeroBannerSchema = z.object({
  title: z.string().trim().min(1, "Укажите заголовок").max(120),
  description: z.string().trim().min(1, "Укажите описание").max(400),
  imageUrl: imageUrlSchema().nullable(),
});

export type AdminPromoHeroBannerInput = z.infer<typeof PromoHeroBannerSchema>;

export async function updatePromoHeroBanner(input: unknown) {
  await requireAdmin();
  const parsed = PromoHeroBannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.promoHeroBanner.upsert({
      where: { id: "singleton" },
      update: parsed.data,
      create: { id: "singleton", ...parsed.data },
    });
    refreshPromotionPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить баннер" };
  }
}

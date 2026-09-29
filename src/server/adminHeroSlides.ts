"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES, HERO_SLIDE_LIMITS, withLegacyHero } from "@/lib/heroSlides";
import { optionalSiteHrefSchema, siteHrefSchema } from "@/lib/hrefSchema";
import { imageUrlSchema } from "@/lib/imageUrlSchema";

const required = (max: number, message: string) => z.string().trim().min(1, message).max(max, `Не длиннее ${max} символов`);

const HeroSlideSchema = z
  .object({
    tabLabel: required(HERO_SLIDE_LIMITS.tabLabel, "Укажите подпись вкладки"),
    eyebrow: required(HERO_SLIDE_LIMITS.eyebrow, "Укажите надпись над заголовком"),
    title: required(HERO_SLIDE_LIMITS.title, "Укажите заголовок"),
    text: required(HERO_SLIDE_LIMITS.text, "Укажите текст"),
    buttonLabel: required(HERO_SLIDE_LIMITS.buttonLabel, "Укажите текст кнопки"),
    buttonHref: siteHrefSchema,
    secondaryLabel: z.string().trim().max(HERO_SLIDE_LIMITS.buttonLabel, `Не длиннее ${HERO_SLIDE_LIMITS.buttonLabel} символов`),
    secondaryHref: optionalSiteHrefSchema,
    imageUrl: imageUrlSchema().nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
  })
  .superRefine((value, ctx) => {
    // Вторая кнопка — либо целиком (подпись и ссылка), либо никак: половина
    // кнопки на сайте выглядела бы как поломка.
    if (Boolean(value.secondaryLabel) !== Boolean(value.secondaryHref)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secondaryHref"],
        message: "У второй кнопки нужны и подпись, и ссылка — или оставьте оба поля пустыми",
      });
    }
  });

export type AdminHeroSlideInput = z.infer<typeof HeroSlideSchema>;

type Result = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/banners");
  revalidatePath("/admin/banners/hero");
}

function toData(input: AdminHeroSlideInput) {
  return {
    ...input,
    secondaryLabel: input.secondaryLabel || null,
    secondaryHref: input.secondaryHref || null,
  };
}

export async function createHeroSlide(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = HeroSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.heroSlide.create({ data: toData(parsed.data) });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось создать слайд" };
  }
}

export async function updateHeroSlide(id: string, input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = HeroSlideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  try {
    await db.heroSlide.update({ where: { id: String(id) }, data: toData(parsed.data) });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось сохранить слайд" };
  }
}

export async function deleteHeroSlide(id: string): Promise<Result> {
  await requireAdmin();
  try {
    await db.heroSlide.delete({ where: { id: String(id) } });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось удалить слайд" };
  }
}

/**
 * Сдвинуть слайд на одну позицию. Заодно нормализует sortOrder в 0,1,2…:
 * после ручных правок числа могли совпадать, и тогда «вверх» не менял бы
 * ничего видимого.
 */
export async function moveHeroSlide(id: string, direction: "up" | "down"): Promise<Result> {
  await requireAdmin();
  const slides = await db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }], select: { id: true } });
  const from = slides.findIndex((slide) => slide.id === id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= slides.length) return { ok: true };
  const order = slides.map((slide) => slide.id);
  [order[from], order[to]] = [order[to]!, order[from]!];
  try {
    await db.$transaction(order.map((slideId, index) => db.heroSlide.update({ where: { id: slideId }, data: { sortOrder: index } })));
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось поменять порядок" };
  }
}

/** Добавить исходные слайды — только в пустую таблицу, чтобы не задвоить. */
export async function restoreDefaultHeroSlides(): Promise<Result> {
  await requireAdmin();
  try {
    if ((await db.heroSlide.count()) > 0) return { ok: false, error: "Слайды уже есть — исходные добавляются только в пустой список" };
    const legacy = await db.siteBanner.findUnique({ where: { key: "home-hero" } });
    await db.heroSlide.createMany({
      data: DEFAULT_HERO_SLIDES.map((slide, index) => ({
        ...(index === 0 ? withLegacyHero(slide, legacy) : slide),
        sortOrder: index,
      })),
    });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось добавить исходные слайды" };
  }
}

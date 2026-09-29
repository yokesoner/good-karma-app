"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { BANNER_KEYS, getBannerSlot } from "@/lib/bannerSlots";
import { db } from "@/lib/db";
import { optionalSiteHrefSchema } from "@/lib/hrefSchema";
import { imageUrlSchema } from "@/lib/imageUrlSchema";

const BannerSchema = z.object({
  eyebrow: z.string().trim().max(120),
  title: z.string().trim().max(120),
  text: z.string().trim().max(500),
  buttonLabel: z.string().trim().max(40),
  href: optionalSiteHrefSchema,
  imageUrl: imageUrlSchema().nullable(),
  isActive: z.boolean(),
});

export type AdminBannerInput = z.infer<typeof BannerSchema>;

// Баннеры живут в разных местах (шапка каждой страницы, главная, меню),
// поэтому сбрасываем кэш всего сайта, а не список отдельных путей — иначе
// правку можно было бы не увидеть на забытой странице.
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function saveSiteBanner(key: string, input: unknown) {
  await requireAdmin();
  const parsedKey = z.enum(BANNER_KEYS).safeParse(key);
  const parsed = BannerSchema.safeParse(input);
  if (!parsedKey.success) return { ok: false as const, error: "Неизвестный баннер" };
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };

  const slot = getBannerSlot(parsedKey.data)!;
  // Сохраняем только поля, которые слот вообще позволяет менять, — даже
  // если клиент прислал лишнее, оно не попадёт в базу.
  const editable = new Set<string>(slot.fields);
  const data = {
    eyebrow: editable.has("eyebrow") ? parsed.data.eyebrow || null : null,
    title: editable.has("title") ? parsed.data.title || null : null,
    text: editable.has("text") ? parsed.data.text || null : null,
    buttonLabel: editable.has("buttonLabel") ? parsed.data.buttonLabel || null : null,
    href: editable.has("href") ? parsed.data.href || null : null,
    imageUrl: editable.has("imageUrl") ? parsed.data.imageUrl : null,
    isActive: slot.toggleable ? parsed.data.isActive : true,
  };

  try {
    await db.siteBanner.upsert({
      where: { key: parsedKey.data },
      update: data,
      create: { key: parsedKey.data, ...data },
    });
    refreshSite();
    revalidatePath("/admin/banners");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить баннер" };
  }
}

/** Вернуть исходные тексты и картинку — просто удаляем строку с правками. */
export async function resetSiteBanner(key: string) {
  await requireAdmin();
  const parsedKey = z.enum(BANNER_KEYS).safeParse(key);
  if (!parsedKey.success) return { ok: false as const, error: "Неизвестный баннер" };
  try {
    await db.siteBanner.deleteMany({ where: { key: parsedKey.data } });
    refreshSite();
    revalidatePath("/admin/banners");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сбросить баннер" };
  }
}

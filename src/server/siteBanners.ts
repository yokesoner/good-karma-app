import { cache } from "react";
import { db } from "@/lib/db";
import { getBannerSlot, mergeBanner, type BannerContent, type BannerKey } from "@/lib/bannerSlots";

// Одна выборка на запрос: главная просит сразу несколько баннеров, а
// cache() из React сводит это к одному обращению к базе на рендер.
const loadOverrides = cache(async () => {
  try {
    const rows = await db.siteBanner.findMany();
    return new Map(rows.map((row) => [row.key, row]));
  } catch (error) {
    // Баннеры — украшение, а не данные заказа: при недоступной базе лучше
    // показать исходные тексты, чем уронить первый экран сайта.
    console.error("Не удалось прочитать баннеры сайта", error);
    return new Map<string, never>();
  }
});

export async function getBanner(key: BannerKey): Promise<BannerContent> {
  const slot = getBannerSlot(key);
  if (!slot) throw new Error(`Неизвестный слот баннера: ${key}`);
  const overrides = await loadOverrides();
  return mergeBanner(slot, overrides.get(key));
}

/** Для списка в админке: есть ли у слота сохранённые правки. */
export async function getBannerOverrideKeys(): Promise<Set<string>> {
  const overrides = await loadOverrides();
  return new Set(overrides.keys());
}

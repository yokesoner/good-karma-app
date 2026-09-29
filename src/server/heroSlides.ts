import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_HERO_SLIDES, withLegacyHero, type HeroSlideContent, type LegacyHeroBanner } from "@/lib/heroSlides";

/**
 * Активные слайды главного экрана в порядке sortOrder. Нет ни одного
 * активного (таблица ещё не засеяна или админ выключил все) — исходный
 * набор из кода: пустой первый экран хуже любого слайда по умолчанию.
 * Как и баннеры (siteBanners.ts), при недоступной базе не роняем главную,
 * а показываем исходные тексты.
 */
export const getHeroSlides = cache(async (): Promise<HeroSlideContent[]> => {
  try {
    const rows = await db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "asc" }],
    });
    if (rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        tabLabel: row.tabLabel,
        eyebrow: row.eyebrow,
        title: row.title,
        text: row.text,
        buttonLabel: row.buttonLabel,
        buttonHref: row.buttonHref,
        secondaryLabel: row.secondaryLabel,
        secondaryHref: row.secondaryHref,
        imageUrl: row.imageUrl,
      }));
    }
    const legacy = await db.siteBanner.findUnique({ where: { key: "home-hero" } });
    return defaultHeroSlides(legacy);
  } catch (error) {
    console.error("Не удалось прочитать слайды главного экрана", error);
    return defaultHeroSlides(null);
  }
});

export function defaultHeroSlides(legacy: LegacyHeroBanner | null): HeroSlideContent[] {
  return DEFAULT_HERO_SLIDES.map((slide, index) => ({
    id: `default-${index}`,
    ...(index === 0 ? withLegacyHero(slide, legacy) : slide),
  }));
}

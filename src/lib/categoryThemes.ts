// Фиксированные наборы значений для "визуального мира" категории
// (CategoryMeta.theme/accentTint/pattern) — тот же приём, что уже
// проверен на src/lib/promoBackgrounds.ts: закрытый список пресетов, не
// свободный цвет, чтобы админ не мог случайно разъехаться с палитрой.

export const CATEGORY_THEME_KEYS = ["sakura", "ember", "calm", "fusion", "fresh", "soft"] as const;
export type CategoryTheme = (typeof CATEGORY_THEME_KEYS)[number];
export const DEFAULT_CATEGORY_THEME: CategoryTheme = "calm";

export const CATEGORY_THEME_LABELS: Record<CategoryTheme, string> = {
  sakura: "Сакура",
  ember: "Огонь",
  calm: "Спокойствие",
  fusion: "Фьюжн",
  fresh: "Свежесть",
  soft: "Мягкость",
};

// Фон "визуального мира" категории (src/app/menu/[id]/page.tsx) — раньше
// там была плоская заливка bg-tint-cream, которая (в отличие от этих
// пастельных hex-градиентов) сама была тёмной в тёмной теме. Фото товара
// поверх обычно закрывает большую часть секции, но не гарантированно —
// у категории может не быть фото вообще — поэтому каждому градиенту
// нужна и тёмная версия (dark:), а не только светлая.
export const CATEGORY_THEME_GRADIENTS: Record<CategoryTheme, string> = {
  sakura: "from-[#F8E8E7] via-[#F4E7ED] to-[#EFDCE4] dark:from-[#3A2530] dark:via-[#332028] dark:to-[#2E2130]",
  ember: "from-[#F7E2D3] via-[#F2CDB4] to-[#EAB894] dark:from-[#3A2418] dark:via-[#3D2A1A] dark:to-[#362013]",
  calm: "from-[#E6EEF0] via-[#EAF0EC] to-[#F0F1E6] dark:from-[#1E2826] dark:via-[#212B27] dark:to-[#242A20]",
  fusion: "from-[#F6E2DD] via-[#F3E1E8] to-[#EAD7EE] dark:from-[#332027] dark:via-[#35242D] dark:to-[#2E2233]",
  fresh: "from-[#E3F0EC] via-[#E6F1F4] to-[#EAF3EE] dark:from-[#1C2B27] dark:via-[#1E2C2E] dark:to-[#20302A]",
  soft: "from-[#F0E6F0] via-[#F3E5EA] to-[#F7EAE2] dark:from-[#2E2530] dark:via-[#31242A] dark:to-[#332720]",
};

export function categoryThemeGradient(theme: string | null | undefined): string {
  if (theme && (CATEGORY_THEME_KEYS as readonly string[]).includes(theme)) {
    return CATEGORY_THEME_GRADIENTS[theme as CategoryTheme];
  }
  return CATEGORY_THEME_GRADIENTS[DEFAULT_CATEGORY_THEME];
}

export const CATEGORY_PATTERN_KEYS = ["sakura", "asanoha", "seigaiha", "kikko", "shippo", "none"] as const;
export type CategoryPattern = (typeof CATEGORY_PATTERN_KEYS)[number];
export const DEFAULT_CATEGORY_PATTERN: CategoryPattern = "none";

// Честно: реальный декоративный ассет сейчас есть только под "seigaiha"
// (ASSETS.decor.seigaihaWave) — остальные значения валидны и сохраняются
// (так в исходных сид-данных категорий), но пока не рисуют ничего
// дополнительного на странице категории.
export const CATEGORY_PATTERN_LABELS: Record<CategoryPattern, string> = {
  sakura: "Сакура",
  asanoha: "Асаноха (пока без ассета)",
  seigaiha: "Сэйгайха — волны",
  kikko: "Кикко (пока без ассета)",
  shippo: "Сиппо (пока без ассета)",
  none: "Без паттерна",
};

export const CATEGORY_ACCENT_TINT_KEYS = [
  "ivory",
  "cream",
  "beige",
  "sakura",
  "blush",
  "rose",
  "peach",
  "gold",
  "mint",
  "sky",
  "lavender",
  "plum",
] as const;
export type CategoryAccentTint = (typeof CATEGORY_ACCENT_TINT_KEYS)[number];
export const DEFAULT_CATEGORY_ACCENT_TINT: CategoryAccentTint = "ivory";

export const CATEGORY_ACCENT_TINT_LABELS: Record<CategoryAccentTint, string> = {
  ivory: "Айвори",
  cream: "Крем",
  beige: "Бежевый",
  sakura: "Сакура",
  blush: "Румянец",
  rose: "Роза",
  peach: "Персик",
  gold: "Золото",
  mint: "Мята",
  sky: "Небо",
  lavender: "Лаванда",
  plum: "Слива",
};

// Явная карта ключ → класс: Tailwind не умеет собирать классы из
// склеенных в рантайме подстрок (`bg-tint-${x}` не заработает).
export const CATEGORY_ACCENT_TINT_BG_CLASS: Record<CategoryAccentTint, string> = {
  ivory: "bg-tint-ivory",
  cream: "bg-tint-cream",
  beige: "bg-tint-beige",
  sakura: "bg-tint-sakura",
  blush: "bg-tint-blush",
  rose: "bg-tint-rose",
  peach: "bg-tint-peach",
  gold: "bg-tint-gold",
  mint: "bg-tint-mint",
  sky: "bg-tint-sky",
  lavender: "bg-tint-lavender",
  plum: "bg-tint-plum",
};

export function categoryAccentTintClass(tint: string | null | undefined): string {
  if (tint && (CATEGORY_ACCENT_TINT_KEYS as readonly string[]).includes(tint)) {
    return CATEGORY_ACCENT_TINT_BG_CLASS[tint as CategoryAccentTint];
  }
  return CATEGORY_ACCENT_TINT_BG_CLASS[DEFAULT_CATEGORY_ACCENT_TINT];
}

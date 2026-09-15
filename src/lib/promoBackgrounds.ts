// Фиксированный набор фонов для карточки акции без фото — не свободный
// цвет, чтобы админ не мог случайно разъехаться с палитрой «Кинцуги-стол»
// (см. AGENTS.md/CLAUDE.md). Значение по умолчанию совпадает с тем, что
// было зашито в коде до появления выбора, — старые акции не меняются
// визуально, пока их не отредактируют.
export const PROMO_BACKGROUND_KEYS = ["sakura", "mint", "gold", "lavender"] as const;
export type PromoBackgroundKey = (typeof PROMO_BACKGROUND_KEYS)[number];
export const DEFAULT_PROMO_BACKGROUND: PromoBackgroundKey = "sakura";

export const PROMO_BACKGROUND_GRADIENTS: Record<PromoBackgroundKey, string> = {
  sakura: "from-[#F8E8E7] via-[#F4E7ED] to-[#E8E2F0]",
  mint: "from-[#EDF3EF] via-[#F1F5EE] to-[#F7F1E8]",
  gold: "from-[#F5EAD8] via-[#F0E2C8] to-[#E9D5B0]",
  lavender: "from-[#ECE6F2] via-[#E6DEEF] to-[#DFD5EA]",
};

export const PROMO_BACKGROUND_LABELS: Record<PromoBackgroundKey, string> = {
  sakura: "Сакура",
  mint: "Мята",
  gold: "Золото",
  lavender: "Лаванда",
};

export function promoBackgroundGradient(key: string | null): string {
  if (key && (PROMO_BACKGROUND_KEYS as readonly string[]).includes(key)) {
    return PROMO_BACKGROUND_GRADIENTS[key as PromoBackgroundKey];
  }
  return PROMO_BACKGROUND_GRADIENTS[DEFAULT_PROMO_BACKGROUND];
}

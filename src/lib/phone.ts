// Единое место нормализации телефона — раньше цифры выковыривали регэкспом
// прямо в actions.ts, теперь то же самое нужно и в identity.ts (профиль).
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw).length >= 10;
}

/**
 * Телефон из базы (только цифры, как ввёл покупатель) → международный вид
 * для ссылки tel: и для форм курьера: «8 906…» и «906…» превращаются в
 * «+7906…». Всё, что не похоже на российский номер, просто получает «+».
 */
export function toDialable(digits: string): string {
  const clean = normalizePhone(digits);
  if (clean.length === 11 && clean.startsWith("8")) return `+7${clean.slice(1)}`;
  if (clean.length === 10) return `+7${clean}`;
  return `+${clean}`;
}

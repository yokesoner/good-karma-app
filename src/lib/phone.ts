// Единое место нормализации телефона — раньше цифры выковыривали регэкспом
// прямо в actions.ts, теперь то же самое нужно и в identity.ts (профиль).
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw).length >= 10;
}

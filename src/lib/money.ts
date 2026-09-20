// Цены в базе хранятся в копейках (priceCents), а не в рублях с плавающей
// точкой — это то единственное расхождение с прототипом, где money() в JS
// работал прямо с целыми рублями. Плавающая точка для денег рано или
// поздно даёт 1489.9999999999998 ₽ в чеке, поэтому копейки с самого начала.

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatMoney(cents: number): string {
  return rub.format(cents / 100);
}

export function rublesToCents(rubles: number): number {
  return Math.round(rubles * 100);
}

// Обратная конвертация — только для отображения существующего значения в
// админ-форме (ввод по-прежнему в рублях, хранение по-прежнему в копейках).
export function centsToRubles(cents: number): number {
  return cents / 100;
}

// Единое форматирование "−20%" / "−300 ₽" — для промокода (Promotion) и
// персональной скидки Karma Club (KarmaDiscountGrant), у которых одна и
// та же пара полей type/discountPct/discountFixedCents означает одно и то
// же (см. computeDiscountCents в src/server/pricing.ts).
export function formatDiscount(type: "PERCENT" | "FIXED", discountPct: number, discountFixedCents: number): string {
  return type === "FIXED" ? `−${formatMoney(discountFixedCents)}` : `−${discountPct}%`;
}

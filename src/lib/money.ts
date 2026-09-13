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

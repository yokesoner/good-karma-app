// Формула конструктора вока: было calculateWokPrice() в прототипе.
// Одна и та же функция используется на клиенте (превью цены при выборе)
// и на сервере (src/server/pricing.ts) — источник истины всё равно сервер,
// клиент просто не должен ей противоречить.

export type WokIngredient = {
  id: string;
  name: string;
  extraCents: number;
};

export function calculateWokPriceCents(
  basePriceCents: number,
  base: WokIngredient,
  protein: WokIngredient,
  sauce: WokIngredient,
) {
  return basePriceCents + base.extraCents + protein.extraCents + sauce.extraCents;
}

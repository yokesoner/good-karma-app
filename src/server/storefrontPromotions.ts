import { db } from "@/lib/db";
import { formatDiscount, formatMoney } from "@/lib/money";
import { promoBackgroundGradient } from "@/lib/promoBackgrounds";
import { promoTiming, recurrenceText, type PromoTiming } from "@/lib/promoSchedule";

/**
 * Акция в том виде, в каком её рисует витрина — карусель на главной и
 * талоны на /promotions. Всё, что зависит от базы и часов кафе, решено
 * здесь, на сервере: компонентам остаётся только разметка, а клиентская
 * карусель получает сериализуемый объект без Date и Decimal.
 */
export type StorefrontPromo = {
  code: string;
  label: string | null;
  /** Название акции; null, если оно просто повторяет размер скидки («−20%»). */
  headline: string | null;
  description: string;
  /** «−20%» / «−300 ₽» */
  discount: string;
  /** «Заказ от 1 500 ₽», null — без минимальной суммы. */
  minOrder: string | null;
  schedule: string | null;
  timing: PromoTiming;
  image: { url: string; alt: string } | null;
  /** Tailwind-классы градиента для акции без картинки. */
  background: string;
};

export async function getStorefrontPromotions({ homeOnly = false }: { homeOnly?: boolean } = {}): Promise<StorefrontPromo[]> {
  const now = new Date();
  const rows = await db.promotion.findMany({
    where: { isActive: true, ...(homeOnly ? { showOnHome: true } : {}) },
    // sortOrder задаёт админ; при равных — как было до его появления,
    // сначала крупные скидки.
    orderBy: [{ sortOrder: "asc" }, { discountPct: "desc" }, { code: "asc" }],
  });

  const visible = rows
    .map((promo) => ({ promo, timing: promoTiming(promo, now) }))
    .filter((entry): entry is { promo: (typeof rows)[number]; timing: PromoTiming } => entry.timing !== null)
    // Идущие сейчас — вперёд: анонс «завтра с 15:00» не должен открывать
    // карусель, пока есть то, чем можно воспользоваться прямо сейчас.
    .sort((a, b) => Number(b.timing.state === "live") - Number(a.timing.state === "live"));

  const productIds = visible
    .filter(({ promo }) => !promo.imageUrl && promo.featuredImageProductId)
    .map(({ promo }) => promo.featuredImageProductId as string);
  const productImages = productIds.length
    ? await db.productImage.findMany({ where: { productId: { in: productIds } }, orderBy: { sortOrder: "asc" } })
    : [];
  const imageByProduct = new Map<string, { url: string; alt: string }>();
  for (const image of productImages) {
    if (!imageByProduct.has(image.productId)) imageByProduct.set(image.productId, { url: image.url, alt: image.alt });
  }

  return visible.map(({ promo, timing }) => {
    const discount = formatDiscount(promo.type, promo.discountPct, promo.discountFixedCents);
    return {
      code: promo.code,
      label: promo.label?.trim() || null,
      // У исходных акций из прототипа название и есть скидка («−20%») —
      // рядом с огромной цифрой скидки второй раз его не печатаем.
      headline: sameText(promo.title, discount) ? null : promo.title,
      description: promo.description,
      discount,
      minOrder: promo.minOrderCents > 0 ? `Заказ от ${formatMoney(promo.minOrderCents)}` : null,
      schedule: recurrenceText(promo),
      timing,
      image: promo.imageUrl
        ? { url: promo.imageUrl, alt: promo.title }
        : promo.featuredImageProductId
          ? imageByProduct.get(promo.featuredImageProductId) ?? null
          : null,
      background: promoBackgroundGradient(promo.backgroundKey),
    };
  });
}

/** Сравнение без пробелов и с любым видом минуса: «-20 %» == «−20%». */
function sameText(a: string, b: string) {
  // \s в JS уже включает неразрывный пробел, которым formatMoney отделяет «₽».
  const norm = (s: string) => s.replace(/\s/g, "").replace(/[-‒-—−]/g, "-").toLowerCase();
  return norm(a) === norm(b);
}

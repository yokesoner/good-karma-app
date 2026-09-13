import { db } from "@/lib/db";
import { getDeliveryZone, deliveryCostCents, type DeliveryZone } from "@/lib/delivery";
import { calculateWokPriceCents } from "@/lib/wok";

export type IncomingWokConfig = {
  baseId: string;
  proteinId: string;
  sauceId: string;
};

export type IncomingLine = {
  productId: string;
  qty: number;
  addonIds: string[];
  wokConfig?: IncomingWokConfig | null;
};

export type PricedLineWokConfig = {
  baseId: string;
  baseName: string;
  proteinId: string;
  proteinName: string;
  sauceId: string;
  sauceName: string;
};

export type PricedOrder = {
  lines: {
    productId: string;
    name: string;
    qty: number;
    unitPriceCents: number;
    addons: { id: string; name: string; priceCents: number }[];
    customConfig?: PricedLineWokConfig | null;
  }[];
  subtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  karmaEarned: number;
  zone: DeliveryZone | null;
  promoCode: string | null;
  promoError: string | null;
};

/**
 * Пересчитывает заказ ПОЛНОСТЬЮ на сервере: цены блюд и добавок берутся
 * из базы, а не из того, что прислал браузер. Это принципиально —
 * в прототипе скидка считалась в JS на клиенте, и подменив её в консоли,
 * можно было оформить заказ за любую сумму. Здесь клиент присылает только
 * "что и сколько", всё остальное решает сервер.
 */
export async function priceOrder(params: {
  lines: IncomingLine[];
  promoCode?: string | null;
  distanceKm?: number | null;
  isPickup: boolean;
}): Promise<PricedOrder> {
  const { lines, promoCode, distanceKm, isPickup } = params;

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const addonIds = [...new Set(lines.flatMap((l) => l.addonIds))];
  const baseIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.baseId] : [])))];
  const proteinIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.proteinId] : [])))];
  const sauceIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.sauceId] : [])))];

  const [products, addons, zones, wokBases, wokProteins, wokSauces] = await Promise.all([
    // isHidden НЕ фильтруем здесь — товар-носитель конструктора вока скрыт
    // из каталога, но должен ценообразовываться. Разрешаем такой товар
    // только для строк с wokConfig — проверка ниже, в цикле по строкам.
    db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, priceCents: true, karma: true, isStopList: true, isHidden: true },
    }),
    addonIds.length
      ? db.addon.findMany({
          where: { id: { in: addonIds } },
          select: { id: true, name: true, priceCents: true },
        })
      : Promise.resolve([]),
    db.deliveryZone.findMany(),
    baseIds.length ? db.wokBase.findMany({ where: { id: { in: baseIds } } }) : Promise.resolve([]),
    proteinIds.length
      ? db.wokProtein.findMany({ where: { id: { in: proteinIds } } })
      : Promise.resolve([]),
    sauceIds.length ? db.wokSauce.findMany({ where: { id: { in: sauceIds } } }) : Promise.resolve([]),
  ]);

  type ProductRow = {
    id: string;
    name: string;
    priceCents: number;
    karma: number;
    isStopList: boolean;
    isHidden: boolean;
  };
  type AddonRow = { id: string; name: string; priceCents: number };
  type WokRow = { id: string; name: string; extraCents: number };

  const productById = new Map<string, ProductRow>(
    (products as ProductRow[]).map((p) => [p.id, p]),
  );
  const addonById = new Map<string, AddonRow>(
    (addons as AddonRow[]).map((a) => [a.id, a]),
  );
  const wokBaseById = new Map<string, WokRow>((wokBases as WokRow[]).map((b) => [b.id, b]));
  const wokProteinById = new Map<string, WokRow>((wokProteins as WokRow[]).map((p) => [p.id, p]));
  const wokSauceById = new Map<string, WokRow>((wokSauces as WokRow[]).map((s) => [s.id, s]));
  // Prisma возвращает Decimal, а модуль расчёта доставки намеренно не
  // зависит от ORM. Преобразуем значение на границе между слоями.
  const deliveryZones: DeliveryZone[] = zones.map((zone) => ({
    zone: zone.zone,
    maxDistanceKm: Number(zone.maxDistanceKm),
    priceCents: zone.priceCents,
    freeFromCents: zone.freeFromCents,
  }));

  const pricedLines: PricedOrder["lines"] = [];
  let subtotalCents = 0;
  let karmaEarned = 0;

  for (const line of lines) {
    const product = productById.get(line.productId);
    // Блюдо удалили или отправили в стоп-лист, пока гость собирал заказ —
    // молча пропускаем, иначе заказ создастся с несуществующей позицией.
    if (!product || product.isStopList) continue;
    // Скрытые товары (в т.ч. носитель конструктора вока) заказать напрямую
    // нельзя — только через валидный wokConfig, иначе это дыра для заказа
    // служебных позиций в обход каталога.
    if (product.isHidden && !line.wokConfig) continue;

    const qty = Math.max(1, Math.min(99, Math.floor(line.qty)));
    const lineAddons = line.addonIds
      .map((id) => addonById.get(id))
      .filter((a): a is NonNullable<typeof a> => !!a);

    let customConfig: PricedLineWokConfig | null = null;
    let name = product.name;
    let unitPriceCents = product.priceCents + lineAddons.reduce((s, a) => s + a.priceCents, 0);

    if (line.wokConfig) {
      const base = wokBaseById.get(line.wokConfig.baseId);
      const protein = wokProteinById.get(line.wokConfig.proteinId);
      const sauce = wokSauceById.get(line.wokConfig.sauceId);
      // Основу/белок/соус сняли с продажи, пока гость собирал вок —
      // так же молча пропускаем строку, как и с удалённым товаром.
      if (!base || !protein || !sauce) continue;

      unitPriceCents = calculateWokPriceCents(product.priceCents, base, protein, sauce);
      name = `${product.name}: ${base.name}, ${protein.name}, ${sauce.name}`;
      customConfig = {
        baseId: base.id,
        baseName: base.name,
        proteinId: protein.id,
        proteinName: protein.name,
        sauceId: sauce.id,
        sauceName: sauce.name,
      };
    }

    subtotalCents += unitPriceCents * qty;
    karmaEarned += product.karma * qty;
    pricedLines.push({
      productId: product.id,
      name,
      qty,
      unitPriceCents,
      addons: lineAddons.map((a) => ({ id: a.id, name: a.name, priceCents: a.priceCents })),
      customConfig,
    });
  }

  // Промокод
  let discountCents = 0;
  let appliedPromo: string | null = null;
  let promoError: string | null = null;

  if (promoCode) {
    const promo = await db.promotion.findUnique({ where: { code: promoCode.toUpperCase() } });
    const now = new Date();
    if (!promo || !promo.isActive) {
      promoError = "Промокод не найден";
    } else if (promo.activeFrom && promo.activeFrom > now) {
      promoError = "Промокод ещё не действует";
    } else if (promo.activeTo && promo.activeTo < now) {
      promoError = "Срок действия промокода истёк";
    } else if (subtotalCents < promo.minOrderCents) {
      promoError = `Промокод действует от ${Math.round(promo.minOrderCents / 100)} ₽`;
    } else {
      discountCents = Math.round((subtotalCents * promo.discountPct) / 100);
      appliedPromo = promo.code;
    }
  }

  const zone = isPickup ? null : getDeliveryZone(deliveryZones, distanceKm ?? null);
  const deliveryCents = isPickup
    ? 0
    : deliveryCostCents(zone, subtotalCents - discountCents);

  return {
    lines: pricedLines,
    subtotalCents,
    discountCents,
    deliveryCents,
    totalCents: subtotalCents - discountCents + deliveryCents,
    karmaEarned,
    zone,
    promoCode: appliedPromo,
    promoError,
  };
}

import type { PromoType } from "@prisma/client";
import { db } from "@/lib/db";
import { getDeliveryZone, deliveryCostCents, type DeliveryZone } from "@/lib/delivery";
import { isPromotionCurrentlyActive } from "@/lib/promoSchedule";
import { calculateWokPriceCents } from "@/lib/wok";

// Общая формула скидки — переиспользуется и промокодом (Promotion), и
// персональной скидкой Karma Club (KarmaDiscountGrant): при FIXED раньше
// discountPct молча интерпретировался как проценты даже для "фиксированной"
// скидки — это и было багом. min(...) не даёт фиксированной скидке уйти в
// минус итоговую сумму.
function computeDiscountCents(
  discount: { type: PromoType; discountPct: number; discountFixedCents: number },
  subtotalCents: number,
): number {
  if (discount.type === "FIXED") {
    return Math.min(discount.discountFixedCents, subtotalCents);
  }
  return Math.round((subtotalCents * discount.discountPct) / 100);
}

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
  // Подарок Karma Club — товар оплачивается баллами, не деньгами (проверка
  // баланса и авторства баллов — в src/server/actions.ts, здесь только
  // сверяется, что этот товар вообще входит в список товаров награды).
  rewardId?: string | null;
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
    isReward?: boolean;
    rewardId?: string | null;
  }[];
  subtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  karmaEarned: number;
  zone: DeliveryZone | null;
  promoCode: string | null;
  promoError: string | null;
  // Персональная скидка Karma Club — занимает тот же "слот" итога, что и
  // промокод, но источник другой (KarmaDiscountGrant, не Promotion), и
  // применяется/погашается по-другому (см. actions.ts) — поэтому не
  // смешиваю с promoCode/promoError, отдельная пара полей.
  karmaDiscountApplied: boolean;
  redeemedRewards: { rewardId: string; costPoints: number; productName: string }[];
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
  // Проверка «один промокод — один телефон» делается в actions.ts (там же
  // есть доступ к БД заказов и телефону) — сюда приходит уже готовый
  // результат, priceOrder просто превращает его в тот же promoError,
  // что и остальные причины отказа применить промокод.
  promoAlreadyUsedByPhone?: boolean;
  // Персональная скидка Karma Club — уже провалидированная в actions.ts
  // (сессия, принадлежность гранта, isUsed). Взаимоисключает promoCode —
  // если задана, promoCode для расчёта скидки не используется вообще.
  karmaDiscount?: { type: PromoType; discountPct: number; discountFixedCents: number } | null;
}): Promise<PricedOrder> {
  const { lines, promoCode, distanceKm, isPickup, promoAlreadyUsedByPhone, karmaDiscount } = params;

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const addonIds = [...new Set(lines.flatMap((l) => l.addonIds))];
  const baseIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.baseId] : [])))];
  const proteinIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.proteinId] : [])))];
  const sauceIds = [...new Set(lines.flatMap((l) => (l.wokConfig ? [l.wokConfig.sauceId] : [])))];
  const rewardIds = [...new Set(lines.flatMap((l) => (l.rewardId ? [l.rewardId] : [])))];

  const [products, addons, zones, wokBases, wokProteins, wokSauces, rewards] = await Promise.all([
    // isHidden НЕ фильтруем здесь — товар-носитель конструктора вока скрыт
    // из каталога, но должен ценообразовываться. Разрешаем такой товар
    // только для строк с wokConfig — проверка ниже, в цикле по строкам.
    db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        priceCents: true,
        karma: true,
        isStopList: true,
        isHidden: true,
        category: { select: { isStopList: true } },
      },
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
    rewardIds.length
      ? db.karmaReward.findMany({
          where: { id: { in: rewardIds } },
          select: { id: true, costPoints: true, isActive: true, products: { select: { productId: true } } },
        })
      : Promise.resolve([]),
  ]);

  type ProductRow = {
    id: string;
    name: string;
    priceCents: number;
    karma: number;
    isStopList: boolean;
    isHidden: boolean;
    category: { isStopList: boolean };
  };
  type AddonRow = { id: string; name: string; priceCents: number };
  type WokRow = { id: string; name: string; extraCents: number };
  type RewardRow = { id: string; costPoints: number; isActive: boolean; products: { productId: string }[] };

  const productById = new Map<string, ProductRow>(
    (products as ProductRow[]).map((p) => [p.id, p]),
  );
  const addonById = new Map<string, AddonRow>(
    (addons as AddonRow[]).map((a) => [a.id, a]),
  );
  const wokBaseById = new Map<string, WokRow>((wokBases as WokRow[]).map((b) => [b.id, b]));
  const wokProteinById = new Map<string, WokRow>((wokProteins as WokRow[]).map((p) => [p.id, p]));
  const wokSauceById = new Map<string, WokRow>((wokSauces as WokRow[]).map((s) => [s.id, s]));
  const rewardById = new Map<string, RewardRow>((rewards as RewardRow[]).map((r) => [r.id, r]));
  // Prisma возвращает Decimal, а модуль расчёта доставки намеренно не
  // зависит от ORM. Преобразуем значение на границе между слоями.
  const deliveryZones: DeliveryZone[] = zones.map((zone) => ({
    zone: zone.zone,
    maxDistanceKm: Number(zone.maxDistanceKm),
    priceCents: zone.priceCents,
    freeFromCents: zone.freeFromCents,
  }));

  const pricedLines: PricedOrder["lines"] = [];
  const redeemedRewards: PricedOrder["redeemedRewards"] = [];
  let subtotalCents = 0;
  let karmaEarned = 0;

  for (const line of lines) {
    const product = productById.get(line.productId);
    // Блюдо удалили или отправили в стоп-лист (само или вместе со всей
    // категорией), пока гость собирал заказ — молча пропускаем, иначе заказ
    // создастся с несуществующей позицией. Корзина заранее предупреждает
    // об этом через getUnavailableProductIds (src/server/availability.ts).
    if (!product || product.isStopList || product.category.isStopList) continue;
    // Скрытые товары (в т.ч. носитель конструктора вока) заказать напрямую
    // нельзя — только через валидный wokConfig, иначе это дыра для заказа
    // служебных позиций в обход каталога.
    if (product.isHidden && !line.wokConfig) continue;

    // Подарок за баллы — отдельная ветка: ровно 1 шт, без добавок и вока,
    // цена не идёт ни в сумму заказа, ни в начисление кармы (уже оплачено
    // баллами). Баланс и авторство баллов проверяет actions.ts до вызова
    // priceOrder — здесь только сверяется, что товар правда из этой награды.
    if (line.rewardId) {
      const reward = rewardById.get(line.rewardId);
      if (!reward || !reward.isActive) continue;
      if (!reward.products.some((p) => p.productId === product.id)) continue;

      pricedLines.push({
        productId: product.id,
        name: product.name,
        qty: 1,
        unitPriceCents: product.priceCents,
        addons: [],
        customConfig: null,
        isReward: true,
        rewardId: reward.id,
      });
      redeemedRewards.push({ rewardId: reward.id, costPoints: reward.costPoints, productName: product.name });
      continue;
    }

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
      // Основу/начинку/соус сняли с продажи, пока гость собирал вок —
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

  // Промокод и персональная скидка Karma Club взаимоисключают друг друга —
  // actions.ts уже гарантирует, что оба сразу сюда не попадут, но порядок
  // проверки ниже (karmaDiscount раньше promoCode) на всякий случай тоже
  // отдаёт приоритет провалидированному серверному гранту, а не тексту,
  // который мог набрать клиент.
  let discountCents = 0;
  let appliedPromo: string | null = null;
  let promoError: string | null = null;
  let karmaDiscountApplied = false;

  if (karmaDiscount) {
    discountCents = computeDiscountCents(
      { type: karmaDiscount.type, discountPct: karmaDiscount.discountPct, discountFixedCents: karmaDiscount.discountFixedCents },
      subtotalCents,
    );
    karmaDiscountApplied = true;
  } else if (promoCode) {
    const promo = await db.promotion.findUnique({ where: { code: promoCode.toUpperCase() } });
    const now = new Date();
    if (promoAlreadyUsedByPhone) {
      promoError = "Этот промокод уже был использован";
    } else if (!promo || !promo.isActive) {
      promoError = "Промокод не найден";
    } else if (promo.activeFrom && promo.activeFrom > now) {
      promoError = "Промокод ещё не действует";
    } else if (promo.activeTo && promo.activeTo < now) {
      promoError = "Срок действия промокода истёк";
    } else if (!isPromotionCurrentlyActive(promo, now)) {
      promoError = "Промокод сейчас не в расписании действия — загляните в другое время";
    } else if (subtotalCents < promo.minOrderCents) {
      promoError = `Промокод действует от ${Math.round(promo.minOrderCents / 100)} ₽`;
    } else {
      discountCents = computeDiscountCents(promo, subtotalCents);
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
    karmaDiscountApplied,
    redeemedRewards,
  };
}

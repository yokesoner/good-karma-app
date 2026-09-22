"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { priceOrder, type IncomingLine } from "@/server/pricing";
import { distanceKm, CAFE, CAFE_CITY, CAFE_CITY_DATIVE, MAX_DELIVERY_KM } from "@/lib/delivery";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoder";
import { normalizePhone, isValidPhone } from "@/lib/phone";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { grantOrderAccess } from "@/lib/orderAccess";
import { notifyAdminsOfNewOrder } from "@/server/adminNotify";
import { checkRewardEligibility } from "@/server/karmaRewards";
import { resolveLevelPerkForPhone, resolveLevelPerkForUser } from "@/server/karmaLevels";

// Награды Karma Club оплачиваются баллами, а не деньгами — баллы
// принадлежат аутентифицированному профилю (/profile, вход по
// Telegram-коду), поэтому без сессии их не потратить: иначе можно было бы
// вписать чужой телефон в форму заказа и списать чужие баллы. Используется
// и в quoteOrder (живой предпросмотр), и в placeOrder (финальное решение).
//
// Награды переиспользуемые: набрал баллы — получил, набрал снова —
// получил ещё раз. Единственное ограничение — текущий баланс, без
// разового «получено навсегда» (это разочаровывало: например, получил
// напиток один раз и больше никогда не мог получить его снова).
async function resolveRewardLines(
  lines: { rewardId?: string | null }[],
): Promise<{ ok: true; userId: string | null } | { ok: false; error: string }> {
  const rewardIds = [...new Set(lines.flatMap((l) => (l.rewardId ? [l.rewardId] : [])))];
  if (rewardIds.length === 0) return { ok: true, userId: null };

  const rewardLineCount = lines.filter((l) => l.rewardId).length;
  if (rewardIds.length !== rewardLineCount) {
    return { ok: false, error: "Каждый подарок можно добавить в заказ только один раз" };
  }

  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false, error: "Войдите в профиль, чтобы использовать подарки за баллы" };

  const [rewards, agg] = await Promise.all([
    db.karmaReward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, costPoints: true, minLevelKey: true, maxRedemptionsPerWeek: true },
    }),
    db.karmaLedgerEntry.aggregate({ where: { userId }, _sum: { points: true } }),
  ]);

  // Уровень и недельный лимит — правила конкретной награды (не про сумму
  // баллов в заказе), см. checkRewardEligibility. Проверяем каждую
  // отдельно: одна недоступная награда не должна прятать причину за
  // общим "недостаточно баллов".
  for (const reward of rewards) {
    const eligibility = await checkRewardEligibility(userId, reward);
    if (!eligibility.ok) return { ok: false, error: eligibility.error };
  }

  const totalCost = rewards.reduce((sum, r) => sum + r.costPoints, 0);
  const balance = agg._sum.points ?? 0;
  if (balance < totalCost) {
    return { ok: false, error: "Недостаточно баллов для этого подарка" };
  }

  return { ok: true, userId };
}

type KarmaDiscountInfo = { id: string; type: "PERCENT" | "FIXED"; discountPct: number; discountFixedCents: number };

// Персональная скидка Karma Club (KarmaDiscountGrant) — выдаётся мгновенно
// при обмене DISCOUNT-награды в /profile (см. redeemDiscountReward в
// src/server/adminKarmaClub.ts) и занимает тот же "слот" на чекауте, что и
// промокод: применить и то и другое разом нельзя (см. проверку в
// quoteOrder/placeOrder ниже). Привязана к userId из сессии — токен
// гранта из devtools не подделать чужим id, потому что здесь сверяется не
// сам id гранта, а его принадлежность текущей сессии.
async function resolveKarmaDiscountGrant(
  grantId: string | null | undefined,
): Promise<{ ok: true; grant: KarmaDiscountInfo | null } | { ok: false; error: string }> {
  if (!grantId) return { ok: true, grant: null };
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false, error: "Войдите в профиль, чтобы применить эту скидку" };
  const grant = await db.karmaDiscountGrant.findUnique({ where: { id: grantId } });
  if (!grant || grant.userId !== userId || grant.isUsed) {
    return { ok: false, error: "Скидка недоступна или уже использована" };
  }
  return {
    ok: true,
    grant: { id: grant.id, type: grant.discountType, discountPct: grant.discountPct, discountFixedCents: grant.discountFixedCents },
  };
}

// Раньше расстояние считалось из lat/lng, которые прислал браузер, — это
// доверяло клиенту (можно было прислать координаты кафе из devtools и
// получить 0 км откуда угодно) и вообще не работало при ручном вводе
// адреса без кнопки геолокации (см. контекст в плане). Теперь единственный
// источник — текст адреса, геокодируемый здесь же, на сервере.
async function resolveDeliveryAddress(
  address: string,
): Promise<{ ok: true; km: number } | { ok: false; error: string }> {
  let geo: Awaited<ReturnType<typeof geocodeAddress>>;
  try {
    geo = await geocodeAddress(address);
  } catch (error) {
    console.error("Геокодирование адреса не удалось", error);
    return { ok: false, error: "Не удалось проверить адрес. Попробуйте ещё раз через минуту" };
  }
  if (!geo) {
    return { ok: false, error: "Не нашли такой адрес. Проверьте написание улицы и дома" };
  }
  if (geo.city && !geo.city.toLowerCase().includes(CAFE_CITY.toLowerCase())) {
    return { ok: false, error: `Мы доставляем только по ${CAFE_CITY_DATIVE}` };
  }
  const km = distanceKm(CAFE.lat, CAFE.lng, geo.lat, geo.lng);
  if (km > MAX_DELIVERY_KM) {
    return {
      ok: false,
      error: `Мы доставляем в пределах ${MAX_DELIVERY_KM} км от кафе. Оформите самовывоз — заказ будет готов за 20 минут.`,
    };
  }
  return { ok: true, km };
}

export async function reverseGeocodeAddress(lat: number, lng: number) {
  try {
    const address = await reverseGeocode(lat, lng);
    if (!address) return { ok: false as const, error: "Не удалось определить адрес по координатам" };
    return { ok: true as const, address };
  } catch (error) {
    console.error("Обратное геокодирование не удалось", error);
    return { ok: false as const, error: "Не удалось определить адрес. Введите его вручную" };
  }
}

const LineSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99),
  addonIds: z.array(z.string()).default([]),
  wokConfig: z
    .object({
      baseId: z.string().min(1),
      proteinId: z.string().min(1),
      sauceId: z.string().min(1),
    })
    .nullable()
    .optional(),
  rewardId: z.string().nullable().optional(),
});

const QuoteSchema = z.object({
  lines: z.array(LineSchema).min(1),
  promoCode: z.string().trim().max(32).nullable().optional(),
  isPickup: z.boolean(),
  address: z.string().trim().max(200).optional(),
  // Необязательный, только чтобы живой предпросмотр на чекауте мог честно
  // предупредить «промокод уже использован» ещё до отправки формы — тот же
  // телефон, который в итоге уйдёт в placeOrder.
  phone: z.string().trim().optional(),
  // Персональная скидка Karma Club — взаимоисключает promoCode (проверка
  // ниже), поэтому на чекауте это один и тот же UI-слот, а не два разных.
  karmaDiscountGrantId: z.string().cuid().nullable().optional(),
});

// Промокоды — один раз на телефон, а не на сессию: применяются и гостям
// без входа в профиль, привязка к User по телефону — единственный
// источник идентичности заказа в проекте (см. placeOrder ниже).
async function isPromoAlreadyUsedByPhone(promoCode: string | null | undefined, phone: string | undefined) {
  if (!promoCode || !phone || !isValidPhone(phone)) return false;
  const existing = await db.order.findFirst({
    where: { promoCode: promoCode.toUpperCase(), user: { phone: normalizePhone(phone) } },
    select: { id: true },
  });
  return Boolean(existing);
}

export type QuoteResult = Awaited<ReturnType<typeof quoteOrder>>;

/** Считает итог заказа для показа на чекауте. Ничего не сохраняет. */
export async function quoteOrder(input: unknown) {
  const parsed = QuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Некорректные данные заказа" };
  }
  const { lines, promoCode, isPickup, address, phone, karmaDiscountGrantId } = parsed.data;

  const rewardCheck = await resolveRewardLines(lines);
  // Награду, которую нельзя списать (нет сессии/баллов/уже получена),
  // не показываем как «бесплатно» в предпросмотре — просто исключаем
  // строку и объясняем почему через rewardError.
  const effectiveLines = rewardCheck.ok ? lines : lines.filter((l) => !l.rewardId);

  let km: number | null = null;
  let addressError: string | null = null;
  if (!isPickup && address) {
    const resolved = await resolveDeliveryAddress(address);
    if (resolved.ok) km = resolved.km;
    else addressError = resolved.error;
  }

  // Промокод и персональная скидка — один и тот же слот на чекауте,
  // применить оба разом клиент не должен, но на случай прямого вызова
  // action сервер тоже это проверяет, а не только прячет второе поле в UI.
  let discountError: string | null = null;
  let effectivePromoCode = promoCode;
  let karmaDiscount: KarmaDiscountInfo | null = null;
  if (karmaDiscountGrantId) {
    if (promoCode) {
      discountError = "Нельзя применить скидку Karma Club вместе с промокодом";
    } else {
      const grantCheck = await resolveKarmaDiscountGrant(karmaDiscountGrantId);
      if (grantCheck.ok) karmaDiscount = grantCheck.grant;
      else discountError = grantCheck.error;
    }
    effectivePromoCode = null;
  }

  const promoAlreadyUsedByPhone = await isPromoAlreadyUsedByPhone(effectivePromoCode, phone);
  // Только для предпросмотра "у вас будет подарок/скидка уровня" — по
  // телефону, который гость уже успел ввести в форму, без создания User
  // (тот появится только при оформлении, см. placeOrder). Пока телефон не
  // введён или ещё не встречался — просто null, это не ошибка.
  const levelPerk = await resolveLevelPerkForPhone(phone && isValidPhone(phone) ? normalizePhone(phone) : null);

  const priced = await priceOrder({
    lines: effectiveLines as IncomingLine[],
    promoCode: effectivePromoCode,
    distanceKm: km,
    isPickup,
    promoAlreadyUsedByPhone,
    karmaDiscount,
    levelPerk,
  });

  return {
    ok: true as const,
    quote: priced,
    distanceKm: km,
    addressError,
    rewardError: rewardCheck.ok ? null : rewardCheck.error,
    discountError,
  };
}

const PlaceSchema = QuoteSchema.extend({
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z.string().trim().refine(isValidPhone, "Укажите телефон"),
  address: z.string().trim().max(200).optional(),
  addressFlat: z.string().trim().max(80).optional(),
  comment: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["CARD_ONLINE", "CARD_ON_DELIVERY", "CASH"]),
});

/**
 * Создаёт заказ. Все суммы пересчитываются здесь заново — то, что
 * показывал чекаут, служит только для интерфейса и не влияет на итог.
 */
export async function placeOrder(input: unknown) {
  const parsed = PlaceSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: first?.message ?? "Проверьте поля формы" };
  }
  const data = parsed.data;

  if (!data.isPickup && !data.address) {
    return { ok: false as const, error: "Укажите адрес доставки" };
  }

  // Курьер деньги не берёт — доставке доступна только онлайн-оплата.
  // Проверяем на сервере, не только в интерфейсе чекаута: иначе прямой
  // вызов placeOrder с isPickup:false мог бы обойти это ограничение.
  if (!data.isPickup && data.paymentMethod !== "CARD_ONLINE") {
    return { ok: false as const, error: "Для доставки доступна только онлайн-оплата картой" };
  }

  const rewardCheck = await resolveRewardLines(data.lines);
  if (!rewardCheck.ok) return { ok: false as const, error: rewardCheck.error };

  let km: number | null = null;
  if (!data.isPickup) {
    const resolved = await resolveDeliveryAddress(data.address!);
    if (!resolved.ok) return { ok: false as const, error: resolved.error };
    km = resolved.km;
  }

  // Тот же слот "скидка на чекауте" — промокод и персональная скидка
  // Karma Club не применяются одновременно (см. resolveKarmaDiscountGrant
  // выше и ту же проверку в quoteOrder).
  let effectivePromoCode = data.promoCode;
  let karmaDiscountGrant: KarmaDiscountInfo | null = null;
  if (data.karmaDiscountGrantId) {
    if (data.promoCode) {
      return { ok: false as const, error: "Нельзя применить скидку Karma Club вместе с промокодом" };
    }
    const grantCheck = await resolveKarmaDiscountGrant(data.karmaDiscountGrantId);
    if (!grantCheck.ok) return { ok: false as const, error: grantCheck.error };
    karmaDiscountGrant = grantCheck.grant;
    effectivePromoCode = null;
  }

  const promoAlreadyUsedByPhone = await isPromoAlreadyUsedByPhone(effectivePromoCode, data.phone);

  // User нужен ДО ценообразования — реальная привилегия уровня (подарок
  // к N-му заказу, автоскидка) считается по его карма-балансу и истории
  // заказов, см. src/server/karmaLevels.ts. Upsert безопасно вызывать
  // раньше: он идемпотентен и не зависит от результата priceOrder.
  const phoneDigits = normalizePhone(data.phone);
  const user = await db.user.upsert({
    where: { phone: phoneDigits },
    update: { name: data.name },
    create: { phone: phoneDigits, name: data.name },
  });
  const levelPerk = await resolveLevelPerkForUser(user.id);

  const priced = await priceOrder({
    lines: data.lines as IncomingLine[],
    promoCode: effectivePromoCode,
    distanceKm: km,
    isPickup: data.isPickup,
    promoAlreadyUsedByPhone,
    karmaDiscount: karmaDiscountGrant,
    levelPerk,
  });

  if (priced.lines.length === 0) {
    return { ok: false as const, error: "Корзина пуста или блюда недоступны" };
  }

  // Баллы списывает resolveRewardLines с userId из сессии — телефон,
  // вписанный в форму заказа, обязан относиться к тому же профилю, иначе
  // баллы одного пользователя ушли бы на заказ, оформленный на другого.
  if (rewardCheck.userId && rewardCheck.userId !== user.id) {
    return { ok: false as const, error: "Телефон в заказе не совпадает с профилем, где баллы. Войдите с тем же номером." };
  }

  // Номер заказа — атомарный счётчик в базе (OrderCounter), формат
  // GK-00001. До старых "случайных" номеров (GK-<5 цифр Date.now()>) на
  // unique-конфликт по числу почти нулевой шанс, но на всякий случай — до
  // 3 попыток со следующим значением счётчика, а не отказ живому клиенту.
  const orderData = (number: string) => ({
    number,
    userId: user.id,
    status: "NEW" as const,
    fulfillment: data.isPickup ? ("PICKUP" as const) : ("DELIVERY" as const),
    address: data.isPickup ? null : data.address,
    addressFlat: data.isPickup ? null : data.addressFlat,
    distanceKm: km,
    deliveryZone: priced.zone?.zone ?? null,
    promoCode: priced.promoCode,
    subtotalCents: priced.subtotalCents,
    discountCents: priced.discountCents,
    deliveryCents: priced.deliveryCents,
    totalCents: priced.totalCents,
    karmaEarned: priced.karmaEarned,
    paymentMethod: data.paymentMethod,
    paymentStatus: "PENDING" as const,
    comment: data.comment || null,
    items: {
      create: priced.lines.map((line) => ({
        productId: line.productId,
        nameSnapshot: line.name,
        qty: line.qty,
        unitPriceCents: line.unitPriceCents,
        addons: {
          create: line.addons.map((a) => ({
            addonId: a.id,
            priceCentsSnapshot: a.priceCents,
          })),
        },
        customConfig: line.customConfig ?? undefined,
      })),
    },
    karmaEntries: {
      create: [
        { userId: user.id, points: priced.karmaEarned, reason: "ORDER_EARNED" as const },
        ...priced.redeemedRewards.map((r) => ({
          userId: user.id,
          rewardId: r.rewardId,
          points: -r.costPoints,
          reason: "REWARD_REDEEMED" as const,
        })),
      ],
    },
  });

  let order = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const counter = await db.orderCounter.upsert({
      where: { id: "singleton" },
      update: { value: { increment: 1 } },
      create: { id: "singleton", value: 1 },
    });
    const number = `GK-${String(counter.value).padStart(5, "0")}`;
    try {
      order = await db.order.create({ data: orderData(number) });
    } catch (error) {
      const isNumberConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("number");
      if (!isNumberConflict) throw error;
    }
  }
  if (!order) {
    return { ok: false as const, error: "Не удалось оформить заказ. Попробуйте ещё раз" };
  }

  // Гасим грант отдельным шагом после создания заказа — тем же паттерном,
  // что grantOrderAccess/notifyAdminsOfNewOrder ниже (не в одной
  // транзакции с order.create, но сама скидка уже учтена в totalCents,
  // так что риск — только очень редкий повторный обмен той же скидки при
  // падении сервера между двумя запросами, не потеря денег).
  if (karmaDiscountGrant) {
    await db.karmaDiscountGrant.update({
      where: { id: karmaDiscountGrant.id },
      data: { isUsed: true, orderId: order.id },
    });
  }

  await grantOrderAccess(order.number);
  await notifyAdminsOfNewOrder(order);

  return { ok: true as const, orderNumber: order.number };
}

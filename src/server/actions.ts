"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { priceOrder, type IncomingLine } from "@/server/pricing";
import { distanceKm, CAFE, MAX_DELIVERY_KM } from "@/lib/delivery";
import { normalizePhone, isValidPhone } from "@/lib/phone";

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
});

const QuoteSchema = z.object({
  lines: z.array(LineSchema).min(1),
  promoCode: z.string().trim().max(32).nullable().optional(),
  isPickup: z.boolean(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export type QuoteResult = Awaited<ReturnType<typeof quoteOrder>>;

/** Считает итог заказа для показа на чекауте. Ничего не сохраняет. */
export async function quoteOrder(input: unknown) {
  const parsed = QuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Некорректные данные заказа" };
  }
  const { lines, promoCode, isPickup, lat, lng } = parsed.data;

  const km =
    !isPickup && typeof lat === "number" && typeof lng === "number"
      ? distanceKm(CAFE.lat, CAFE.lng, lat, lng)
      : null;

  const priced = await priceOrder({
    lines: lines as IncomingLine[],
    promoCode,
    distanceKm: km,
    isPickup,
  });

  return {
    ok: true as const,
    quote: priced,
    distanceKm: km,
    tooFar: !isPickup && km !== null && km > MAX_DELIVERY_KM,
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

  const km =
    !data.isPickup && typeof data.lat === "number" && typeof data.lng === "number"
      ? distanceKm(CAFE.lat, CAFE.lng, data.lat, data.lng)
      : null;

  if (!data.isPickup && km !== null && km > MAX_DELIVERY_KM) {
    return { ok: false as const, error: "Мы доставляем в пределах 20 км. Выберите самовывоз." };
  }

  const priced = await priceOrder({
    lines: data.lines as IncomingLine[],
    promoCode: data.promoCode,
    distanceKm: km,
    isPickup: data.isPickup,
  });

  if (priced.lines.length === 0) {
    return { ok: false as const, error: "Корзина пуста или блюда недоступны" };
  }

  const phoneDigits = normalizePhone(data.phone);
  const user = await db.user.upsert({
    where: { phone: phoneDigits },
    update: { name: data.name },
    create: { phone: phoneDigits, name: data.name },
  });

  // Номер заказа: GK-<5 цифр>. Для прототипа достаточно, для продакшена
  // стоит заменить на последовательность в БД, чтобы исключить коллизии
  // при одновременных заказах.
  const number = `GK-${String(Date.now()).slice(-5)}`;

  const order = await db.order.create({
    data: {
      number,
      userId: user.id,
      status: "NEW",
      fulfillment: data.isPickup ? "PICKUP" : "DELIVERY",
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
      paymentStatus: "PENDING",
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
        create: {
          userId: user.id,
          points: priced.karmaEarned,
          reason: "ORDER_EARNED",
        },
      },
    },
  });

  return { ok: true as const, orderNumber: order.number };
}

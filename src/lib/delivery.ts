// Координаты и адрес кафе — единственный источник истины для расчёта зон
// доставки, карты (CafeMap) и всех мест, где адрес показывается текстом.
export const CAFE = { lat: 45.032381, lng: 41.980932 } as const;
export const CAFE_ADDRESS = "Ставрополь, переулок Крупской, 29/1";
export const CAFE_CITY = "Ставрополь";
// Дательный падеж («доставляем только по …») — склонение не выводится
// программно, город один, проще и надёжнее написать явно.
export const CAFE_CITY_DATIVE = "Ставрополю";

export const MAX_DELIVERY_KM = 20;

export type DeliveryZone = {
  zone: number;
  maxDistanceKm: number;
  priceCents: number;
  freeFromCents: number;
};

/**
 * Расстояние по прямой между двумя точками, формула гаверсинуса.
 * Это «по воздуху», а не по дорогам — на первом этапе достаточно,
 * при подключении Яндекс.Геокодера заменим на реальный маршрут.
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}

/**
 * Зона по расстоянию. Границы включающие снизу: ровно 4 км — это ещё
 * первая зона, 4.1 — уже вторая. Ошибка на границе здесь означает
 * неверную цену доставки, поэтому логика вынесена отдельно и покрыта
 * проверкой в scripts/check-delivery.ts.
 */
export function getDeliveryZone(
  zones: DeliveryZone[],
  km: number | null,
): DeliveryZone | null {
  if (km === null || Number.isNaN(km)) return null;
  if (km > MAX_DELIVERY_KM) return null;
  const sorted = [...zones].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
  return sorted.find((z) => km <= z.maxDistanceKm) ?? null;
}

/** Стоимость доставки с учётом порога бесплатной доставки этой зоны. */
export function deliveryCostCents(
  zone: DeliveryZone | null,
  subtotalAfterDiscountCents: number,
): number {
  if (!zone) return 0;
  return subtotalAfterDiscountCents >= zone.freeFromCents ? 0 : zone.priceCents;
}

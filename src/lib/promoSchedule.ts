import type { Promotion } from "@prisma/client";

// Единственный источник истины "активна ли акция прямо сейчас" —
// используется и на витрине (PromotionsSection), и при расчёте заказа
// (pricing.ts), и в списке /admin/promotions. Раньше витрина проверяла
// только isActive, а даты — только расчёт заказа: истёкшая акция
// продолжала висеть баннером, хотя её уже нельзя было применить.
//
// activeFrom/activeTo — необязательная внешняя рамка кампании.
// recurrence сужает её на конкретные моменты внутри этой рамки: время
// суток (DAILY), день недели + время (WEEKLY) или число месяца + время
// (MONTHLY). При recurrence = NONE рамка и есть всё окно действия.
const CAFE_TIMEZONE = "Europe/Moscow";

type PromoScheduleFields = Pick<
  Promotion,
  | "isActive"
  | "activeFrom"
  | "activeTo"
  | "recurrence"
  | "recurrenceStartTime"
  | "recurrenceEndTime"
  | "recurrenceWeekdays"
  | "recurrenceDayOfMonth"
>;

function cafeNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAFE_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    weekday: weekdayMap[get("weekday")] ?? now.getDay(),
    dayOfMonth: Number(get("day")),
    minutesSinceMidnight: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isWithinTimeWindow(minutesSinceMidnight: number, startTime: string | null, endTime: string | null) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return true;
  // Окно может переходить через полночь (например, 22:00–02:00).
  if (start <= end) return minutesSinceMidnight >= start && minutesSinceMidnight < end;
  return minutesSinceMidnight >= start || minutesSinceMidnight < end;
}

export function isPromotionCurrentlyActive(promo: PromoScheduleFields, now: Date = new Date()): boolean {
  if (!promo.isActive) return false;
  if (promo.activeFrom && promo.activeFrom > now) return false;
  if (promo.activeTo && promo.activeTo < now) return false;

  if (promo.recurrence === "NONE") return true;

  const cafe = cafeNow(now);
  if (promo.recurrence === "DAILY") {
    return isWithinTimeWindow(cafe.minutesSinceMidnight, promo.recurrenceStartTime, promo.recurrenceEndTime);
  }
  if (promo.recurrence === "WEEKLY") {
    if (!promo.recurrenceWeekdays.includes(cafe.weekday)) return false;
    return isWithinTimeWindow(cafe.minutesSinceMidnight, promo.recurrenceStartTime, promo.recurrenceEndTime);
  }
  if (promo.recurrence === "MONTHLY") {
    if (promo.recurrenceDayOfMonth !== cafe.dayOfMonth) return false;
    return isWithinTimeWindow(cafe.minutesSinceMidnight, promo.recurrenceStartTime, promo.recurrenceEndTime);
  }
  return true;
}

export type PromoStatus = "active" | "scheduled" | "expired" | "disabled";

// Для бейджа в /admin/promotions — отличает "выключена вручную" от
// "включена, но сейчас вне окна" от "срок вышел совсем".
export function promotionStatus(promo: PromoScheduleFields, now: Date = new Date()): PromoStatus {
  if (!promo.isActive) return "disabled";
  if (promo.activeTo && promo.activeTo < now) return "expired";
  if (isPromotionCurrentlyActive(promo, now)) return "active";
  return "scheduled";
}

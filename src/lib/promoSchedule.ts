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

// ---------- витрина: «идёт сейчас» / «начнётся» ----------
//
// Раньше акция вне своего окна просто исчезала с сайта: «Счастливые часы»
// были видны только с 15 до 18, и в остальное время гость не узнавал, что
// они вообще существуют. Рестораны делают наоборот — анонсируют заранее.
// promoTiming отвечает, показывать ли акцию на витрине и с какой подписью;
// применимость промокода по-прежнему решает только isPromotionCurrentlyActive.

/** Насколько вперёд анонсируем ближайшее окно повторяющейся акции. */
const ANNOUNCE_AHEAD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PromoTiming =
  | { state: "live"; note: string | null }
  | { state: "upcoming"; note: string };

const WEEKDAY_ACCUSATIVE = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];
const WEEKDAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

const cafeTime = new Intl.DateTimeFormat("ru-RU", { timeZone: CAFE_TIMEZONE, hour: "2-digit", minute: "2-digit" });
const cafeDate = new Intl.DateTimeFormat("ru-RU", { timeZone: CAFE_TIMEZONE, day: "numeric", month: "long" });

function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

function dayMatches(promo: PromoScheduleFields, weekday: number, dayOfMonth: number) {
  if (promo.recurrence === "WEEKLY") return promo.recurrenceWeekdays.includes(weekday);
  if (promo.recurrence === "MONTHLY") return promo.recurrenceDayOfMonth === dayOfMonth;
  return true;
}

const cafeDayKey = new Intl.DateTimeFormat("en-CA", { timeZone: CAFE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Сколько календарных дней кафе между датами: 0 — сегодня, 1 — завтра. */
function cafeDayOffset(from: Date, to: Date) {
  return Math.round((Date.parse(cafeDayKey.format(to)) - Date.parse(cafeDayKey.format(from))) / DAY_MS);
}

/** Длительность окна времени суток; окно может переходить через полночь. */
function windowDurationMs(promo: PromoScheduleFields) {
  const start = parseTimeToMinutes(promo.recurrenceStartTime);
  const end = parseTimeToMinutes(promo.recurrenceEndTime);
  if (start === null || end === null) return DAY_MS;
  return (((end - start + 1440) % 1440) || 1440) * 60_000;
}

/**
 * Ближайшее начало действия повторяющейся акции в пределах недели, либо null.
 * Если кампания (activeFrom) начинается посреди окна — началом считается
 * activeFrom, а не начало окна: иначе анонс называл бы не тот день или
 * вовсе прятал акцию, которая стартует сегодня в 16:00 при окне 15–18.
 */
function nextWindowStart(promo: PromoScheduleFields, now: Date): Date | null {
  const start = parseTimeToMinutes(promo.recurrenceStartTime) ?? 0;
  const duration = windowDurationMs(promo);
  const today = cafeNow(now);
  for (let d = 0; d <= ANNOUNCE_AHEAD_DAYS; d++) {
    const day = cafeNow(new Date(now.getTime() + d * DAY_MS));
    if (!dayMatches(promo, day.weekday, day.dayOfMonth)) continue;
    const windowStart = new Date(now.getTime() + d * DAY_MS + (start - today.minutesSinceMidnight) * 60_000);
    const windowEnd = new Date(windowStart.getTime() + duration);
    const at = promo.activeFrom && promo.activeFrom > windowStart ? promo.activeFrom : windowStart;
    if (at <= now || at >= windowEnd) continue;
    if (promo.activeTo && at >= promo.activeTo) return null;
    return at;
  }
  return null;
}

function dayLabel(at: Date, now: Date) {
  const offset = cafeDayOffset(now, at);
  if (offset === 0) return "сегодня";
  if (offset === 1) return "завтра";
  return WEEKDAY_ACCUSATIVE[cafeNow(at).weekday] ?? "";
}

/** «до 18:00», а если это уже завтра — «до 10:00 завтра». */
function untilNote(end: Date, now: Date) {
  return cafeDayOffset(now, end) === 0 ? `до ${cafeTime.format(end)}` : `до ${cafeTime.format(end)} завтра`;
}

/** null — акцию на витрине не показываем (выключена, истекла, далеко в будущем). */
export function promoTiming(promo: PromoScheduleFields, now: Date = new Date()): PromoTiming | null {
  if (!promo.isActive) return null;
  if (promo.activeTo && promo.activeTo < now) return null;

  if (isPromotionCurrentlyActive(promo, now)) {
    if (promo.recurrence !== "NONE" && promo.recurrenceEndTime) {
      // Конец сегодняшнего окна, но не позже конца всей кампании: при окне
      // 15–18 и activeTo сегодня в 16:00 промокод перестанет действовать в 16.
      const endMinutes = parseTimeToMinutes(promo.recurrenceEndTime) ?? 0;
      const minutesLeft = ((endMinutes - cafeNow(now).minutesSinceMidnight + 1440) % 1440) || 1440;
      const windowEnd = new Date(now.getTime() + minutesLeft * 60_000);
      const end = promo.activeTo && promo.activeTo < windowEnd ? promo.activeTo : windowEnd;
      return { state: "live", note: untilNote(end, now) };
    }
    if (promo.activeTo) {
      const left = promo.activeTo.getTime() - now.getTime();
      if (left < DAY_MS) return { state: "live", note: untilNote(promo.activeTo, now) };
      if (left < ANNOUNCE_AHEAD_DAYS * DAY_MS) return { state: "live", note: `ещё ${pluralDays(Math.ceil(left / DAY_MS))}` };
      return { state: "live", note: `до ${cafeDate.format(promo.activeTo)}` };
    }
    return { state: "live", note: null };
  }

  if (promo.recurrence === "NONE") {
    if (promo.activeFrom && promo.activeFrom.getTime() - now.getTime() <= ANNOUNCE_AHEAD_DAYS * DAY_MS) {
      return { state: "upcoming", note: `с ${cafeDate.format(promo.activeFrom)}` };
    }
    return null;
  }

  const next = nextWindowStart(promo, now);
  if (!next) return null;
  return { state: "upcoming", note: `${dayLabel(next, now)} с ${cafeTime.format(next)}` };
}

/** «по будням 15:00–18:00», «каждый день», «каждое 5-е число» — для условий акции. */
export function recurrenceText(promo: PromoScheduleFields): string | null {
  const time =
    promo.recurrenceStartTime && promo.recurrenceEndTime ? ` ${promo.recurrenceStartTime}–${promo.recurrenceEndTime}` : "";
  if (promo.recurrence === "DAILY") return `каждый день${time}`;
  if (promo.recurrence === "MONTHLY" && promo.recurrenceDayOfMonth) return `каждое ${promo.recurrenceDayOfMonth}-е число${time}`;
  if (promo.recurrence === "WEEKLY") {
    const days = [...promo.recurrenceWeekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const key = days.join(",");
    const label =
      key === "1,2,3,4,5" ? "по будням" : key === "6,0" ? "по выходным" : days.length === 7 ? "каждый день" : days.map((d) => WEEKDAY_SHORT[d]).join(", ");
    return `${label}${time}`;
  }
  return null;
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

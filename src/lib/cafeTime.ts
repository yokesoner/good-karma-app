// Время в кафе — всегда по Москве (Ставрополь живёт по московскому времени,
// без перехода на летнее с 2014 года). Сервер на VPS работает в UTC, и
// toLocaleString() без timeZone показывал бы заказы на три часа раньше, чем
// они были сделаны на самом деле — поэтому часовой пояс указываем явно.
export const CAFE_TIME_ZONE = "Europe/Moscow";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAFE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: CAFE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: CAFE_TIME_ZONE,
  day: "numeric",
  month: "short",
});

const fullFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: CAFE_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** «сегодня, 17:42» / «вчера, 09:12» / «9 авг., 17:42». */
export function formatOrderTime(date: Date, now: Date = new Date()): string {
  const time = timeFormatter.format(date);
  const dayKey = dayKeyFormatter.format(date);
  const todayKey = dayKeyFormatter.format(now);
  if (dayKey === todayKey) return `сегодня, ${time}`;
  const yesterdayKey = dayKeyFormatter.format(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (dayKey === yesterdayKey) return `вчера, ${time}`;
  return `${dateFormatter.format(date)}, ${time}`;
}

/** «21.09.2026, 17:42» — для подробных карточек. */
export function formatCafeDateTime(date: Date): string {
  return fullFormatter.format(date);
}

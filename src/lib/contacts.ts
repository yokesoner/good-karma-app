// Контакты кафе в одном месте: подвал и служебные страницы (404, сбой)
// должны показывать один и тот же номер. Адрес живёт рядом с координатами
// кафе в delivery.ts (от него считаются зоны) — здесь только реэкспорт.
// Телефон курьерской службы на странице заказа — отдельная сущность
// (см. order/[number]/page.tsx).
export { CAFE_ADDRESS } from "@/lib/delivery";

export const CAFE_PHONE = "+7 (812) 000-00-00";
export const CAFE_EMAIL = "hi@goodkarma.cafe";

export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

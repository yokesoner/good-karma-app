import { CAFE_ADDRESS } from "@/lib/delivery";
import { toDialable } from "@/lib/phone";

// Яндекс Доставка не принимает адреса и телефон в параметрах ссылки, поэтому
// кнопка в админке открывает личный кабинет, а данные заказа для формы курьера
// копирует в буфер обмена (buildCourierBrief). Полностью автоматический вызов
// курьера возможен только через API Яндекс Доставки — ему нужен договор и
// токен, см. YANDEX_DELIVERY_URL в .env.example.
export const DEFAULT_YANDEX_DELIVERY_URL = "https://dostavka.yandex.ru/account2/";

/** Только для серверных компонентов: читает необязательную переменную окружения. */
export function getYandexDeliveryUrl(): string {
  const custom = process.env.YANDEX_DELIVERY_URL?.trim();
  return custom && /^https:\/\//i.test(custom) ? custom : DEFAULT_YANDEX_DELIVERY_URL;
}

export type CourierBriefInput = {
  number: string;
  customerName: string | null;
  customerPhone: string;
  address: string | null;
  addressFlat: string | null;
  comment: string | null;
};

/** Текст, который админ вставляет в форму заказа курьера. */
export function buildCourierBrief(order: CourierBriefInput): string {
  const destination = [order.address, order.addressFlat && `кв. ${order.addressFlat}`].filter(Boolean).join(", ");
  const lines = [
    `Заказ ${order.number}`,
    `Откуда: ${CAFE_ADDRESS}`,
    `Куда: ${destination || "адрес не указан"}`,
    `Получатель: ${[order.customerName, toDialable(order.customerPhone)].filter(Boolean).join(", ")}`,
  ];
  if (order.comment) lines.push(`Комментарий: ${order.comment}`);
  return lines.join("\n");
}

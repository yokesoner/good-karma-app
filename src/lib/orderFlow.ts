import type { ORDER_STATUS_LABELS } from "@/lib/orderLabels";

// Единая логика «что делать с заказом дальше» — одна кнопка вместо ручного
// выбора статуса в выпадающем списке. Админу на кухне не до селектов:
// в списке заказов и на карточке заказа показываем один следующий шаг.
// Используется и серверной страницей (какие кнопки рисовать), и клиентской
// кнопкой; сами переходы проверяет сервер (src/server/adminOrders.ts).

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABELS;
export type OrderFulfillmentKey = "DELIVERY" | "PICKUP";

export type OrderStep = { label: string; to: OrderStatusKey };

type OrderLike = { status: OrderStatusKey; fulfillment: OrderFulfillmentKey };

/** Статусы, в которых заказ ещё «в работе» и попадает во вкладку «Активные». */
export const ACTIVE_ORDER_STATUSES = ["NEW", "PREPARING", "READY_FOR_PICKUP", "HANDED_TO_COURIER", "DELIVERING"] as const;

/** Доставку можно передать курьеру, пока она ещё не в пути и не закрыта. */
export function canOrderYandexDelivery(order: OrderLike): boolean {
  return order.fulfillment === "DELIVERY" && ["NEW", "PREPARING", "HANDED_TO_COURIER"].includes(order.status);
}

/**
 * Главный следующий шаг (не считая Яндекс Доставки — она отдельная кнопка со
 * ссылкой). Возвращает null, когда делать нечего или шаг — ожидание клиента.
 */
export function nextStepFor(order: OrderLike): OrderStep | null {
  if (order.status === "NEW") return { label: "Принять в работу", to: "PREPARING" };
  if (order.fulfillment === "PICKUP") {
    if (order.status === "PREPARING") return { label: "Готов к выдаче", to: "READY_FOR_PICKUP" };
    if (order.status === "READY_FOR_PICKUP") return { label: "Выдан клиенту", to: "DONE" };
    return null;
  }
  if (order.status === "DELIVERING") return { label: "Отметить доставленным", to: "DONE" };
  return null;
}

/** Цвет плашки статуса — одна палитра на списке, карточке и дашборде. */
export function statusTone(status: OrderStatusKey): string {
  switch (status) {
    case "NEW":
      return "bg-tint-gold text-ink";
    case "PREPARING":
      return "bg-tint-peach text-ink";
    case "READY_FOR_PICKUP":
      return "bg-tint-mint text-ink";
    case "HANDED_TO_COURIER":
    case "DELIVERING":
      return "bg-tint-sky text-ink";
    case "DONE":
      return "bg-tint-mint text-ink-2";
    case "CANCELLED":
      return "bg-tint-blush text-cherry";
  }
}

/** Точка слева от статуса — быстрый ориентир глазами в длинном списке. */
export function statusDot(status: OrderStatusKey): string {
  switch (status) {
    case "NEW":
      return "bg-gold";
    case "PREPARING":
      return "bg-cherry-soft";
    case "READY_FOR_PICKUP":
    case "DONE":
      return "bg-mint-deep";
    case "HANDED_TO_COURIER":
    case "DELIVERING":
      return "bg-plum";
    case "CANCELLED":
      return "bg-ink-3";
  }
}

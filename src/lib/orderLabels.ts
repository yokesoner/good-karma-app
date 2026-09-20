export const ORDER_STATUS_LABELS = {
  NEW: "Заказ принят",
  PREPARING: "Готовится",
  READY_FOR_PICKUP: "Готов к выдаче",
  HANDED_TO_COURIER: "Передан в доставку",
  DELIVERING: "Доставляется",
  DONE: "Выполнен",
  CANCELLED: "Отменён",
} as const;

export const PAYMENT_METHOD_LABELS = {
  CARD_ONLINE: "Онлайн картой",
  CARD_ON_DELIVERY: "Картой при получении",
  CASH: "Наличными",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Ожидает",
  PAID: "Оплачен",
  FAILED: "Не прошла",
  REFUNDED: "Возврат",
} as const;

export const FULFILLMENT_LABELS = {
  DELIVERY: "Доставка",
  PICKUP: "Самовывоз",
} as const;

// Статусы доставки («Передан в доставку», «Доставляется») бессмысленны для
// самовывоза, и наоборот («Готов к выдаче» — только для самовывоза).
// Единый источник этого правила — используется и в админ-форме статуса
// (какие варианты показывать), и на сервере (чтобы прямой вызов
// updateAdminOrder не мог поставить заказу на самовывоз статус доставки),
// и на странице заказа (какие этапы показывать покупателю).
export const ALLOWED_STATUSES_BY_FULFILLMENT = {
  PICKUP: ["NEW", "PREPARING", "READY_FOR_PICKUP", "DONE", "CANCELLED"],
  DELIVERY: ["NEW", "PREPARING", "HANDED_TO_COURIER", "DELIVERING", "DONE", "CANCELLED"],
} as const satisfies Record<"PICKUP" | "DELIVERY", readonly (keyof typeof ORDER_STATUS_LABELS)[]>;

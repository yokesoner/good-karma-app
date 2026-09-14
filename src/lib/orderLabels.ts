export const ORDER_STATUS_LABELS = {
  NEW: "Заказ принят",
  PREPARING: "Готовится",
  HANDED_TO_COURIER: "Передан в доставку",
  DELIVERING: "Доставляется",
  DONE: "Выполнен",
  CANCELLED: "Отменён",
} as const;

export const PAYMENT_METHOD_LABELS = {
  CARD_ONLINE: "Онлайн картой",
  CARD_ON_DELIVERY: "Картой курьеру",
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

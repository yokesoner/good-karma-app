import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies } from "next/headers";

// Номера заказов последовательные (GK-00001, GK-00002, ...), поэтому
// /order/[number] нельзя оставлять открытым всем подряд — иначе состав и
// адрес доставки любого заказа читаются простым перебором URL. Доступ
// выдаётся подписанной cookie (после чекаута — автоматически, иначе —
// после подтверждения телефона в trackOrder), а не по факту знания URL.
export const ORDER_ACCESS_COOKIE = "gk_order_access";
const TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_GRANTED_ORDERS = 20;

function accessSecret() {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("CUSTOMER_SESSION_SECRET должен содержать не менее 32 символов");
  }
  return new TextEncoder().encode(value);
}

async function readGrantedOrders(): Promise<string[]> {
  const token = cookies().get(ORDER_ACCESS_COOKIE)?.value;
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, accessSecret(), { algorithms: ["HS256"] });
    return Array.isArray(payload.orders) ? payload.orders.filter((o): o is string => typeof o === "string") : [];
  } catch {
    return [];
  }
}

export async function hasOrderAccess(number: string): Promise<boolean> {
  const orders = await readGrantedOrders();
  return orders.includes(number);
}

// «Гостевой профиль» без аккаунта: список заказов, к которым этот браузер
// уже подтвердил доступ (свой чекаут или ввод телефона), последние сверху.
// Для постоянной истории с любого устройства — вход в /profile.
export async function getGrantedOrderNumbers(): Promise<string[]> {
  const orders = await readGrantedOrders();
  return [...orders].reverse();
}

export async function grantOrderAccess(number: string) {
  const existing = await readGrantedOrders();
  const next = [...existing.filter((n) => n !== number), number].slice(-MAX_GRANTED_ORDERS);
  const token = await new SignJWT({ orders: next })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(accessSecret());
  cookies().set(ORDER_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

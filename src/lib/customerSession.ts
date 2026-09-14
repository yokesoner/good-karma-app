import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

// Отдельный секрет и cookie от admin-сессии: разные домены доверия,
// компрометация/ротация одного не должна затрагивать другой.
export const CUSTOMER_SESSION_COOKIE = "gk_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // покупатель не логинится каждый день

export type CustomerSessionPayload = {
  userId: string;
};

function sessionSecret() {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("CUSTOMER_SESSION_SECRET должен содержать не менее 32 символов");
  }
  return new TextEncoder().encode(value);
}

export async function signCustomerSession(payload: CustomerSessionPayload) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}

export async function verifyCustomerSession(token: string): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

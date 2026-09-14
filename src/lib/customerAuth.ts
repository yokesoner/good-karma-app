import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "@/lib/customerSession";

// userId в cookie только подтверждает, кем представился браузер на момент
// входа по SMS-коду; здесь всегда перепроверяем, что такой пользователь
// всё ещё существует — тот же принцип, что у getCurrentAdmin().
export async function getCurrentCustomerId(): Promise<string | null> {
  const token = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyCustomerSession(token);
  if (!session) return null;

  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  return user?.id ?? null;
}

export async function requireCustomerId(): Promise<string> {
  const userId = await getCurrentCustomerId();
  if (!userId) throw new Error("Требуется вход в профиль");
  return userId;
}

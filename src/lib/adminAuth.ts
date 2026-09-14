import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";

export async function getCurrentAdmin() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyAdminSession(token);
  if (!session) return null;

  const admin = await db.adminUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true },
  });
  return admin;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Требуется вход администратора");
  return admin;
}

// Управление командой (/admin/team) — единственное, что отделено ролью:
// остальные разделы админки одинаково доступны OWNER и STAFF.
export async function requireOwner() {
  const admin = await requireAdmin();
  if (admin.role !== "OWNER") throw new Error("Доступно только владельцу");
  return admin;
}

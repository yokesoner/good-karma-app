import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTeamForm } from "@/components/admin/AdminTeamForm";
import { getCurrentAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = { title: "Новый администратор — админка Гуд Карма" };

export default async function NewAdminTeamMemberPage() {
  const me = await getCurrentAdmin();
  if (me?.role !== "OWNER") redirect("/admin/orders");

  return (
    <div>
      <Link href="/admin/team" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Команда</Link>
      <h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новый администратор</h1>
      <AdminTeamForm />
    </div>
  );
}

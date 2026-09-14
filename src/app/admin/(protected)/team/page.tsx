import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminRoleSelect } from "@/components/admin/AdminRoleSelect";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { deleteAdminTeamMember } from "@/server/adminTeam";

export const metadata: Metadata = { title: "Команда — админка Гуд Карма" };

const ROLE_LABELS = { OWNER: "Владелец", STAFF: "Сотрудник" } as const;

export default async function AdminTeamPage() {
  const me = await getCurrentAdmin();
  if (me?.role !== "OWNER") redirect("/admin/orders");

  const admins = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Доступ</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Команда</h1>
          <p className="mt-2 text-sm text-ink-2">
            Роль решает только доступ к этой странице — остальные разделы админки одинаковы для владельца и сотрудника.
          </p>
        </div>
        <Link href="/admin/team/new" className="rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить администратора</Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
        <div className="hidden grid-cols-[1fr_160px_190px_170px] gap-4 border-b border-hair px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 lg:grid">
          <span>Администратор</span><span>Роль</span><span>Последний вход</span><span className="text-right">Действия</span>
        </div>
        {admins.map((admin) => (
          <article key={admin.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 lg:grid-cols-[1fr_160px_190px_170px] lg:items-center">
            <div>
              <h2 className="font-semibold">{admin.name} {admin.id === me.id && <span className="ml-1 text-xs font-normal text-ink-3">(вы)</span>}</h2>
              <p className="mt-1 text-xs text-ink-3">{admin.email}</p>
            </div>
            <p className="text-sm text-ink-2">{ROLE_LABELS[admin.role]}</p>
            <p className="text-sm text-ink-2">{admin.lastLoginAt ? admin.lastLoginAt.toLocaleString("ru-RU") : "Ещё не входил"}</p>
            <div className="flex items-center justify-end gap-4">
              <AdminRoleSelect id={admin.id} role={admin.role} />
              {admin.id !== me.id && <AdminDeleteButton identifier={admin.id} label={admin.name} action={deleteAdminTeamMember} />}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

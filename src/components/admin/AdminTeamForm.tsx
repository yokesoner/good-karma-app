"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { createAdminTeamMember } from "@/server/adminTeam";

export function AdminTeamForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      name: String(form.get("name") ?? ""),
      role: String(form.get("role") ?? "STAFF"),
    };
    setError("");
    startTransition(async () => {
      const result = await createAdminTeamMember(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/team");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label>
          <span className={adminLabelClass}>Email</span>
          <input name="email" type="email" required maxLength={200} className={adminFieldClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Пароль</span>
          <input name="password" type="password" required minLength={10} maxLength={200} className={adminFieldClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Имя</span>
          <input name="name" required maxLength={80} className={adminFieldClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Роль</span>
          <select name="role" defaultValue="STAFF" className={adminFieldClass}>
            <option value="STAFF">Сотрудник</option>
            <option value="OWNER">Владелец</option>
          </select>
        </label>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/team")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Создаём…" : "Создать"}</button>
      </div>
    </form>
  );
}

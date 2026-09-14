"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { createAdminKarmaLevel, type AdminKarmaLevelInput, updateAdminKarmaLevel } from "@/server/adminKarmaClub";

export function AdminKarmaLevelForm({ initial }: { initial?: AdminKarmaLevelInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminKarmaLevelInput = {
      key: String(form.get("key") ?? ""),
      name: String(form.get("name") ?? ""),
      fromKarma: Number(form.get("fromKarma")),
      toKarma: Number(form.get("toKarma")),
      icon: String(form.get("icon") ?? ""),
      perk: String(form.get("perk") ?? ""),
    };
    setError("");
    startTransition(async () => {
      const result = initial ? await updateAdminKarmaLevel(initial.key, input) : await createAdminKarmaLevel(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/karma-club");
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label><span className={adminLabelClass}>Ключ</span><input name="key" required maxLength={40} readOnly={!!initial} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={initial?.key} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Название</span><input name="name" required maxLength={80} defaultValue={initial?.name} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>От, баллов</span><input name="fromKarma" type="number" min={0} max={10_000_000} step={1} required defaultValue={initial?.fromKarma ?? 0} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>До, баллов</span><input name="toKarma" type="number" min={1} max={10_000_001} step={1} required defaultValue={initial?.toKarma ?? 1} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Иконка</span><input name="icon" required maxLength={40} defaultValue={initial?.icon} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Привилегия</span><textarea name="perk" required maxLength={300} rows={4} defaultValue={initial?.perk} className={adminFieldClass} /></label>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/admin/karma-club")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button><button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button></div>
    </form>
  );
}

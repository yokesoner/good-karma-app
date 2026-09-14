"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { createAdminKarmaReward, type AdminKarmaRewardInput, updateAdminKarmaReward } from "@/server/adminKarmaClub";

export function AdminKarmaRewardForm({ id, initial }: { id?: string; initial?: AdminKarmaRewardInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminKarmaRewardInput = {
      costPoints: Number(form.get("costPoints")),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      isActive: form.get("isActive") === "on",
    };
    setError("");
    startTransition(async () => {
      const result = id ? await updateAdminKarmaReward(id, input) : await createAdminKarmaReward(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/karma-club");
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label><span className={adminLabelClass}>Стоимость, баллов</span><input name="costPoints" type="number" min={0} max={10_000_000} step={1} required defaultValue={initial?.costPoints ?? 0} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Название</span><input name="title" required maxLength={120} defaultValue={initial?.title} className={adminFieldClass} /></label>
        <label className="md:col-span-2"><span className={adminLabelClass}>Описание</span><textarea name="description" required maxLength={400} rows={5} defaultValue={initial?.description} className={adminFieldClass} /></label>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} /> Награда активна</label>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/admin/karma-club")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button><button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : id ? "Сохранить" : "Создать"}</button></div>
    </form>
  );
}

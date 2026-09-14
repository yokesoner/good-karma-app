"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import type { AdminWokIngredientInput } from "@/server/adminWokIngredients";

type Result = { ok: true } | { ok: false; error: string };

export function AdminWokIngredientForm({
  initial,
  idLabel,
  backHref,
  createAction,
  updateAction,
}: {
  initial?: AdminWokIngredientInput;
  idLabel: string;
  backHref: string;
  createAction: (input: unknown) => Promise<Result>;
  updateAction: (id: string, input: unknown) => Promise<Result>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminWokIngredientInput = {
      id: String(form.get("id") ?? ""),
      name: String(form.get("name") ?? ""),
      extraCents: Number(form.get("extraCents")),
    };
    setError("");
    startTransition(async () => {
      const result = initial ? await updateAction(initial.id, input) : await createAction(input);
      if (!result.ok) return setError(result.error);
      router.push(backHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label>
          <span className={adminLabelClass}>{idLabel}</span>
          <input name="id" required maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" readOnly={!!initial} defaultValue={initial?.id} className={adminFieldClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Название</span>
          <input name="name" required maxLength={80} defaultValue={initial?.name} className={adminFieldClass} />
        </label>
        <label>
          <span className={adminLabelClass}>Наценка, копейки</span>
          <input name="extraCents" type="number" min={0} max={10_000_000} step={1} required defaultValue={initial?.extraCents ?? 0} className={adminFieldClass} />
        </label>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push(backHref)} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button>
      </div>
    </form>
  );
}

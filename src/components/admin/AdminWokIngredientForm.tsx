"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { centsToRubles, rublesToCents } from "@/lib/money";
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
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminWokIngredientInput = {
      id: String(form.get("id") ?? ""),
      name: String(form.get("name") ?? ""),
      extraCents: rublesToCents(Number(form.get("extraRubles"))),
      imageUrl,
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
          <span className={adminLabelClass}>Наценка, ₽</span>
          <input name="extraRubles" type="number" min={0} step={0.01} required defaultValue={centsToRubles(initial?.extraCents ?? 0)} className={adminFieldClass} />
        </label>
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Своя фотография</span>
          <p className="mb-2 text-xs text-ink-3">Если не задана, конструктор берёт слой из реестра ассетов по ID.</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- превью произвольного S3-URL, next/image тут не нужен */
              <img src={imageUrl} alt="" className="h-16 w-16 rounded-2xl border border-hair object-cover" />
            )}
            <AdminImageUploader folder="wok" onUploaded={(url) => setImageUrl(url)} />
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">Убрать</button>
            )}
          </div>
        </div>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push(backHref)} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button>
      </div>
    </form>
  );
}

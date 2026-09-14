"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { createAdminDeliveryZone, type AdminDeliveryZoneInput, updateAdminDeliveryZone } from "@/server/adminDeliveryZones";

export function AdminDeliveryZoneForm({ initial }: { initial?: AdminDeliveryZoneInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminDeliveryZoneInput = {
      zone: Number(form.get("zone")),
      maxDistanceKm: Number(form.get("maxDistanceKm")),
      priceCents: Number(form.get("priceCents")),
      freeFromCents: Number(form.get("freeFromCents")),
    };
    setError("");
    startTransition(async () => {
      const result = initial ? await updateAdminDeliveryZone(String(initial.zone), input) : await createAdminDeliveryZone(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/delivery-zones");
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-gold/40 bg-tint-gold px-5 py-4 text-sm leading-relaxed">
        Изменения применяются к расчёту новых заказов сразу. Радиус каждой следующей зоны должен быть строго больше предыдущей — сервер не сохранит нарушенный порядок.
      </div>
      <section className={adminPanelClass}>
        <label><span className={adminLabelClass}>Номер зоны</span><input name="zone" type="number" min={1} max={5} step={1} required readOnly={!!initial} defaultValue={initial?.zone ?? 1} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Максимальный радиус, км</span><input name="maxDistanceKm" type="number" min={0.1} max={20} step={0.1} required defaultValue={initial?.maxDistanceKm ?? 4} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Стоимость доставки, копейки</span><input name="priceCents" type="number" min={0} max={10_000_000} step={1} required defaultValue={initial?.priceCents ?? 0} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Бесплатно от, копейки</span><input name="freeFromCents" type="number" min={0} max={100_000_000} step={1} required defaultValue={initial?.freeFromCents ?? 0} className={adminFieldClass} /></label>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/admin/delivery-zones")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button><button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button></div>
    </form>
  );
}

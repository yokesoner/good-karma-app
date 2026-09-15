"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { createAdminPromotion, type AdminPromotionInput, updateAdminPromotion } from "@/server/adminPromotions";
import { PROMO_BACKGROUND_KEYS, PROMO_BACKGROUND_LABELS, DEFAULT_PROMO_BACKGROUND } from "@/lib/promoBackgrounds";

type ProductOption = { id: string; name: string };

function localDateTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminPromotionForm({ initial, products }: { initial?: AdminPromotionInput; products: ProductOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dateValue = (name: string) => {
      const value = String(form.get(name) ?? "");
      return value ? new Date(value).toISOString() : null;
    };
    const featured = String(form.get("featuredImageProductId") ?? "");
    const input: AdminPromotionInput = {
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      type: String(form.get("type")) as AdminPromotionInput["type"],
      discountPct: Number(form.get("discountPct")),
      minOrderCents: Number(form.get("minOrderCents")),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      activeFrom: dateValue("activeFrom"),
      activeTo: dateValue("activeTo"),
      isActive: form.get("isActive") === "on",
      featuredImageProductId: featured || null,
      imageUrl,
      backgroundKey: (String(form.get("backgroundKey") ?? "") || null) as AdminPromotionInput["backgroundKey"],
    };
    setError("");
    startTransition(async () => {
      const result = initial ? await updateAdminPromotion(initial.code, input) : await createAdminPromotion(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/promotions");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label><span className={adminLabelClass}>Промокод</span><input name="code" required maxLength={40} readOnly={!!initial} defaultValue={initial?.code} className={`${adminFieldClass} uppercase`} /></label>
        <label><span className={adminLabelClass}>Тип</span><select name="type" defaultValue={initial?.type ?? "PERCENT"} className={adminFieldClass}><option value="PERCENT">Процент</option><option value="FIXED">Фиксированный</option></select></label>
        <label><span className={adminLabelClass}>Скидка, %</span><input name="discountPct" type="number" min={0} max={100} step={1} required defaultValue={initial?.discountPct ?? 0} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Минимальный заказ, копейки</span><input name="minOrderCents" type="number" min={0} max={100_000_000} step={1} required defaultValue={initial?.minOrderCents ?? 0} className={adminFieldClass} /></label>
        <label className="md:col-span-2"><span className={adminLabelClass}>Название</span><input name="title" required maxLength={120} defaultValue={initial?.title} className={adminFieldClass} /></label>
        <label className="md:col-span-2"><span className={adminLabelClass}>Описание</span><textarea name="description" required maxLength={600} rows={5} defaultValue={initial?.description} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Начало</span><input name="activeFrom" type="datetime-local" defaultValue={localDateTime(initial?.activeFrom ?? null)} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Окончание</span><input name="activeTo" type="datetime-local" defaultValue={localDateTime(initial?.activeTo ?? null)} className={adminFieldClass} /></label>
        <label className="md:col-span-2"><span className={adminLabelClass}>Товар для изображения</span><select name="featuredImageProductId" defaultValue={initial?.featuredImageProductId ?? ""} className={adminFieldClass}><option value="">Без товара</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Своя картинка карточки</span>
          <p className="mb-2 text-xs text-ink-3">Приоритетнее товара выше — если задана, используется она.</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- превью произвольного S3-URL, next/image тут не нужен */
              <img src={imageUrl} alt="" className="h-16 w-16 rounded-2xl border border-hair object-cover" />
            )}
            <AdminImageUploader folder="promotions" onUploaded={(url) => setImageUrl(url)} />
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">Убрать</button>
            )}
          </div>
        </div>
        <label><span className={adminLabelClass}>Фон карточки (если без картинки)</span><select name="backgroundKey" defaultValue={initial?.backgroundKey ?? DEFAULT_PROMO_BACKGROUND} className={adminFieldClass}>{PROMO_BACKGROUND_KEYS.map((key) => <option key={key} value={key}>{PROMO_BACKGROUND_LABELS[key]}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} /> Акция активна</label>
      </section>
      <p className="text-xs text-ink-3">Поле скидки хранится в текущем поле модели <code>discountPct</code>; расчёт заказа сейчас использует процентное значение.</p>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/promotions")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button>
      </div>
    </form>
  );
}

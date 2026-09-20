"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { centsToRubles, rublesToCents } from "@/lib/money";
import { createAdminKarmaReward, type AdminKarmaRewardInput, updateAdminKarmaReward } from "@/server/adminKarmaClub";

type ProductOption = { id: string; name: string };
type LevelOption = { key: string; name: string };

export function AdminKarmaRewardForm({
  id,
  initial,
  products,
  levels,
}: {
  id?: string;
  initial?: AdminKarmaRewardInput;
  products: ProductOption[];
  levels: LevelOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [kind, setKind] = useState<AdminKarmaRewardInput["kind"]>(initial?.kind ?? "PRODUCT");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(initial?.discountType ?? "PERCENT");

  function toggleProduct(productId: string) {
    setProductIds((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minLevelKey = String(form.get("minLevelKey") ?? "") || null;
    const maxRedemptionsPerWeek = form.get("maxRedemptionsPerWeek") ? Number(form.get("maxRedemptionsPerWeek")) : null;
    const input: AdminKarmaRewardInput = {
      costPoints: Number(form.get("costPoints")),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      isActive: form.get("isActive") === "on",
      kind,
      productIds,
      discountType: kind === "DISCOUNT" ? discountType : null,
      discountPct: kind === "DISCOUNT" && discountType === "PERCENT" ? Number(form.get("discountPct")) : null,
      discountFixedCents: kind === "DISCOUNT" && discountType === "FIXED" ? rublesToCents(Number(form.get("discountFixedRubles"))) : null,
      minLevelKey,
      maxRedemptionsPerWeek,
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
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Тип награды</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["PRODUCT", "Товар"],
                ["DISCOUNT", "Скидка"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  kind === value ? "border-plum-deep bg-plum-deep text-btn-fg" : "border-hair bg-paper text-ink-2 hover:border-plum"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label><span className={adminLabelClass}>Минимальный уровень</span><select name="minLevelKey" defaultValue={initial?.minLevelKey ?? ""} className={adminFieldClass}><option value="">Без ограничения</option>{levels.map((level) => <option key={level.key} value={level.key}>{level.name}</option>)}</select></label>
        <label><span className={adminLabelClass}>Лимит обменов в неделю</span><input name="maxRedemptionsPerWeek" type="number" min={1} max={1000} step={1} defaultValue={initial?.maxRedemptionsPerWeek ?? ""} placeholder="без лимита" className={adminFieldClass} /></label>
        <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={initial?.isActive ?? true} /> Награда активна</label>
      </section>

      {kind === "PRODUCT" ? (
        <section className={adminPanelClass}>
          <div className="md:col-span-2">
            <span className={adminLabelClass}>Товары этой награды</span>
            <p className="mb-3 text-xs text-ink-3">
              Один товар — обмен сразу добавляет его в корзину. Несколько — покупатель выбирает один при обмене.
            </p>
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-hair bg-paper p-3">
              {products.length === 0 && <p className="p-2 text-sm text-ink-2">В каталоге пока нет товаров.</p>}
              {products.map((product) => (
                <label key={product.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-paper-3">
                  <input
                    type="checkbox"
                    checked={productIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                  />
                  {product.name}
                </label>
              ))}
            </div>
            {productIds.length === 0 && (
              <p className="mt-2 text-xs text-cherry">Без товара покупатели не смогут обменять эту награду.</p>
            )}
          </div>
        </section>
      ) : (
        <section className={adminPanelClass}>
          <div className="md:col-span-2">
            <span className={adminLabelClass}>Скидка</span>
            <p className="mb-3 text-xs text-ink-3">
              Обмен выдаёт покупателю личную скидку сразу (без выбора товара) — списывает баллы в момент обмена в профиле, скидка применяется вместо промокода на чекауте.
            </p>
          </div>
          <label>
            <span className={adminLabelClass}>Тип</span>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")} className={adminFieldClass}>
              <option value="PERCENT">Процент</option>
              <option value="FIXED">Фиксированная, ₽</option>
            </select>
          </label>
          {discountType === "PERCENT" ? (
            <label><span className={adminLabelClass}>Скидка, %</span><input name="discountPct" type="number" min={0} max={100} step={1} required defaultValue={initial?.discountPct ?? 10} className={adminFieldClass} /></label>
          ) : (
            <label><span className={adminLabelClass}>Скидка, ₽</span><input name="discountFixedRubles" type="number" min={0} step={0.01} required defaultValue={centsToRubles(initial?.discountFixedCents ?? 0)} className={adminFieldClass} /></label>
          )}
        </section>
      )}

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/admin/karma-club")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button><button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : id ? "Сохранить" : "Создать"}</button></div>
    </form>
  );
}

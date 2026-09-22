"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { LevelIcon } from "@/components/LevelIcon";
import { createAdminKarmaLevel, type AdminKarmaLevelInput, updateAdminKarmaLevel } from "@/server/adminKarmaClub";

const PRESET_ICONS = ["seed", "blossom", "moon", "karma"] as const;

const PERK_KIND_LABELS = {
  NONE: "Нет — только базовое начисление",
  MILESTONE_GIFT: "Подарок к каждому N-му заказу",
  CLAIMABLE: "Можно запросить раз в N дней",
  ALWAYS_DISCOUNT: "Скидка на каждый заказ",
} as const;

export function AdminKarmaLevelForm({
  initial,
  products,
}: {
  initial?: AdminKarmaLevelInput;
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [icon, setIcon] = useState(initial?.icon ?? "seed");
  const [perkKind, setPerkKind] = useState<AdminKarmaLevelInput["perkKind"]>(initial?.perkKind ?? "NONE");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const num = (name: string) => {
      const value = form.get(name);
      return value === null || value === "" ? null : Number(value);
    };
    const str = (name: string) => {
      const value = String(form.get(name) ?? "").trim();
      return value || null;
    };
    const input: AdminKarmaLevelInput = {
      key: String(form.get("key") ?? ""),
      name: String(form.get("name") ?? ""),
      fromKarma: Number(form.get("fromKarma")),
      toKarma: Number(form.get("toKarma")),
      icon,
      perk: String(form.get("perk") ?? ""),
      perkKind,
      perkEveryNOrders: perkKind === "MILESTONE_GIFT" ? num("perkEveryNOrders") : null,
      perkProductId: perkKind === "MILESTONE_GIFT" ? str("perkProductId") : null,
      perkDiscountPct: perkKind === "ALWAYS_DISCOUNT" ? num("perkDiscountPct") : null,
      perkClaimEveryDays: perkKind === "CLAIMABLE" ? num("perkClaimEveryDays") : null,
      perkDescription: perkKind === "CLAIMABLE" ? str("perkDescription") : null,
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
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Иконка</span>
          <p className="mb-2 text-xs text-ink-3">Готовый символ или своя картинка — не угаданное слово.</p>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_ICONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setIcon(preset)}
                aria-pressed={icon === preset}
                className={`grid h-12 w-12 place-items-center rounded-2xl border transition ${
                  icon === preset ? "border-plum-deep bg-tint-sakura" : "border-hair bg-paper hover:border-plum"
                }`}
              >
                <LevelIcon name={preset} className="h-6 w-6 text-ink" />
              </button>
            ))}
            <span className="h-8 w-px bg-hair" aria-hidden />
            {!PRESET_ICONS.includes(icon as (typeof PRESET_ICONS)[number]) && icon && (
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-plum-deep bg-tint-sakura">
                <LevelIcon name={icon} className="h-8 w-8 object-cover" />
              </span>
            )}
            <AdminImageUploader folder="levels" onUploaded={(url) => setIcon(url)} />
          </div>
        </div>
        <label className="md:col-span-2"><span className={adminLabelClass}>Витрина (текст)</span><textarea name="perk" required maxLength={300} rows={2} defaultValue={initial?.perk} className={adminFieldClass} />
          <p className="mt-1.5 text-xs text-ink-3">Показывается на публичной странице и демо-доске. Держите в согласии с настройками ниже — они сами по себе ничего не пишут покупателю.</p>
        </label>
      </section>

      <section className={adminPanelClass}>
        <label className="md:col-span-2">
          <span className={adminLabelClass}>Реальная привилегия</span>
          <select value={perkKind} onChange={(e) => setPerkKind(e.target.value as AdminKarmaLevelInput["perkKind"])} className={adminFieldClass}>
            {Object.entries(PERK_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <p className="mt-1.5 text-xs text-ink-3">Это то, что реально происходит на заказе или в профиле — не просто слова в тексте выше.</p>
        </label>

        {perkKind === "MILESTONE_GIFT" && (
          <>
            <label><span className={adminLabelClass}>Каждый который заказ</span><input name="perkEveryNOrders" type="number" min={1} max={50} step={1} defaultValue={initial?.perkEveryNOrders ?? 3} className={adminFieldClass} /></label>
            <label><span className={adminLabelClass}>Товар-подарок</span>
              <select name="perkProductId" defaultValue={initial?.perkProductId ?? ""} className={adminFieldClass}>
                <option value="">— выберите товар —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          </>
        )}

        {perkKind === "ALWAYS_DISCOUNT" && (
          <label><span className={adminLabelClass}>Процент скидки</span><input name="perkDiscountPct" type="number" min={1} max={100} step={1} defaultValue={initial?.perkDiscountPct ?? 10} className={adminFieldClass} /></label>
        )}

        {perkKind === "CLAIMABLE" && (
          <>
            <label><span className={adminLabelClass}>Раз в сколько дней</span><input name="perkClaimEveryDays" type="number" min={1} max={365} step={1} defaultValue={initial?.perkClaimEveryDays ?? 30} className={adminFieldClass} /></label>
            <label className="md:col-span-2"><span className={adminLabelClass}>Что можно попросить</span><textarea name="perkDescription" rows={2} maxLength={400} defaultValue={initial?.perkDescription ?? ""} className={adminFieldClass} />
              <p className="mt-1.5 text-xs text-ink-3">Покажется клиенту в профиле. Заявка не создаёт заказ — просто уведомляет вас в Telegram, дальше вы договариваетесь напрямую.</p>
            </label>
          </>
        )}
      </section>

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" onClick={() => router.push("/admin/karma-club")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button><button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button></div>
    </form>
  );
}

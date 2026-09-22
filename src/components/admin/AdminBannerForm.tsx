"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { AdminSwitch } from "@/components/admin/AdminSwitch";
import { adminFieldClass, adminLabelClass } from "@/components/admin/formStyles";
import { ArrowUpRight } from "@/components/icons";
import type { BannerContent, BannerSlot } from "@/lib/bannerSlots";
import { useToast } from "@/lib/toast";
import { resetSiteBanner, saveSiteBanner } from "@/server/adminBanners";

const FIELD_LABELS = {
  eyebrow: "Надпись сверху",
  title: "Заголовок",
  text: "Текст",
  buttonLabel: "Текст кнопки",
  href: "Ссылка",
  imageUrl: "Картинка",
} as const;

// Форма одного баннера: показывает только те поля, которые слот разрешает
// менять (BANNER_SLOTS), и подставляет то, что сейчас на сайте — админ
// правит живой текст, а не пустые поля. «Сбросить» возвращает исходные
// тексты и картинку из кода.
export function AdminBannerForm({
  slot,
  initial,
  customized,
}: {
  slot: BannerSlot;
  initial: BannerContent;
  customized: boolean;
}) {
  const router = useRouter();
  const showToast = useToast((state) => state.show);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl);
  const [isActive, setIsActive] = useState(initial.isActive);
  const has = (field: keyof typeof FIELD_LABELS) => (slot.fields as readonly string[]).includes(field);
  const label = (field: keyof typeof FIELD_LABELS) => slot.labels?.[field] ?? FIELD_LABELS[field];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    setError("");
    setBusy(true);
    try {
      const result = await saveSiteBanner(slot.key, {
        eyebrow: text("eyebrow"),
        title: text("title"),
        text: text("text"),
        buttonLabel: text("buttonLabel"),
        href: text("href"),
        imageUrl,
        isActive,
      });
      if (!result.ok) return setError(result.error);
      showToast("Сохранено — изменения уже на сайте");
      router.refresh();
    } catch {
      setError("Нет связи с сервером — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("Вернуть исходные тексты и картинку этого баннера?")) return;
    setError("");
    setBusy(true);
    try {
      const result = await resetSiteBanner(slot.key);
      if (!result.ok) return setError(result.error);
      showToast("Возвращены исходные значения");
      // Страница пересоздаёт форму (key зависит от customized), поэтому поля
      // сами покажут исходные тексты.
      router.refresh();
    } catch {
      setError("Нет связи с сервером — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="space-y-5 rounded-[24px] border border-hair bg-paper-2 p-4 md:p-7">
        {slot.toggleable && (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-paper-3/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Показывать на сайте</p>
              <p className="mt-0.5 text-xs text-ink-3">{isActive ? "Сейчас видна всем посетителям" : "Сейчас скрыта"}</p>
            </div>
            <AdminSwitch checked={isActive} onChange={setIsActive} label="Показывать баннер на сайте" />
          </div>
        )}

        {has("eyebrow") && (
          <label className="block">
            <span className={adminLabelClass}>{label("eyebrow")}</span>
            <input name="eyebrow" maxLength={120} defaultValue={initial.eyebrow} className={adminFieldClass} />
            {slot.hints?.eyebrow && <span className="mt-1.5 block text-xs text-ink-3">{slot.hints.eyebrow}</span>}
          </label>
        )}
        {has("title") && (
          <label className="block">
            <span className={adminLabelClass}>{label("title")}</span>
            <input name="title" maxLength={120} defaultValue={initial.title} className={adminFieldClass} />
          </label>
        )}
        {has("text") && (
          <label className="block">
            <span className={adminLabelClass}>{label("text")}</span>
            <textarea name="text" maxLength={500} rows={4} defaultValue={initial.text} className={adminFieldClass} />
            {slot.hints?.text && <span className="mt-1.5 block text-xs text-ink-3">{slot.hints.text}</span>}
          </label>
        )}
        {has("buttonLabel") && (
          <label className="block">
            <span className={adminLabelClass}>{label("buttonLabel")}</span>
            <input name="buttonLabel" maxLength={40} defaultValue={initial.buttonLabel} className={adminFieldClass} />
          </label>
        )}
        {has("href") && (
          <label className="block">
            <span className={adminLabelClass}>{label("href")}</span>
            <input name="href" maxLength={300} defaultValue={initial.href} placeholder="/menu или https://…" className={adminFieldClass} />
            {slot.hints?.href && <span className="mt-1.5 block text-xs text-ink-3">{slot.hints.href}</span>}
          </label>
        )}
        {has("imageUrl") && (
          <div>
            <span className={adminLabelClass}>{label("imageUrl")}</span>
            <p className="mb-2 text-xs text-ink-3">Если не загружать — остаётся исходная картинка сайта.</p>
            <div className="flex flex-wrap items-center gap-3">
              {imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element -- превью произвольного URL, next/image тут не нужен */
                <img src={imageUrl} alt="" className="h-16 w-28 rounded-2xl border border-hair object-cover" />
              )}
              <AdminImageUploader folder="banners" onUploaded={(url) => setImageUrl(url)} />
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">
                  Убрать
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={busy}
          className="min-h-11 flex-1 rounded-full bg-plum-deep px-7 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg transition active:scale-[0.98] disabled:opacity-50 sm:flex-none"
        >
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <a
          href={slot.previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-hair px-5 text-xs font-bold uppercase tracking-[0.1em]"
        >
          Открыть на сайте <ArrowUpRight />
        </a>
        {customized && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void reset()}
            className="min-h-11 px-3 text-xs font-semibold text-cherry hover:underline disabled:opacity-50"
          >
            Сбросить к исходному
          </button>
        )}
      </div>
    </form>
  );
}

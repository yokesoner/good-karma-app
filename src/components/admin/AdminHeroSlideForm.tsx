"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { AdminSwitch } from "@/components/admin/AdminSwitch";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { HERO_FALLBACK_IMAGE, HERO_SLIDE_LIMITS } from "@/lib/heroSlides";
import { useToast } from "@/lib/toast";
import { createHeroSlide, updateHeroSlide, type AdminHeroSlideInput } from "@/server/adminHeroSlides";

type Fields = Omit<AdminHeroSlideInput, "imageUrl" | "isActive" | "sortOrder">;

const EMPTY: Fields = {
  tabLabel: "",
  eyebrow: "",
  title: "",
  text: "",
  buttonLabel: "",
  buttonHref: "",
  secondaryLabel: "",
  secondaryHref: "",
};

// Форма слайда главного экрана с живым превью: админ видит, как текст ляжет
// на фото, ещё до сохранения. Лимиты длины — те же, что проверяет сервер
// (HERO_SLIDE_LIMITS), и счётчик показывает остаток.
export function AdminHeroSlideForm({
  id,
  initial,
}: {
  id?: string;
  initial?: AdminHeroSlideInput;
}) {
  const router = useRouter();
  const showToast = useToast((state) => state.show);
  const [fields, setFields] = useState<Fields>(
    initial
      ? {
          tabLabel: initial.tabLabel,
          eyebrow: initial.eyebrow,
          title: initial.title,
          text: initial.text,
          buttonLabel: initial.buttonLabel,
          buttonHref: initial.buttonHref,
          secondaryLabel: initial.secondaryLabel ?? "",
          secondaryHref: initial.secondaryHref ?? "",
        }
      : EMPTY,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: event.target.value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const input: AdminHeroSlideInput = { ...fields, imageUrl, isActive, sortOrder };
    try {
      const result = id ? await updateHeroSlide(id, input) : await createHeroSlide(input);
      if (!result.ok) return setError(result.error);
      showToast(id ? "Слайд сохранён — он уже на главной" : "Слайд добавлен");
      router.push("/admin/banners/hero");
      router.refresh();
    } catch {
      setError("Нет связи с сервером — попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  const counter = (value: string, max: number) => (
    <span className={`text-xs tabular-nums ${value.length > max ? "text-cherry" : "text-ink-3"}`}>
      {value.length}/{max}
    </span>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Превью: те же пропорции и градиент, что у героя на сайте. */}
      <div className="relative isolate overflow-hidden rounded-[24px] border border-hair bg-tint-ivory">
        {/* eslint-disable-next-line @next/next/no-img-element -- превью произвольного URL, next/image тут не нужен */}
        <img src={imageUrl ?? HERO_FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--t-ivory))_0%,rgb(var(--t-ivory)/.95)_36%,rgb(var(--t-ivory)/.5)_58%,transparent_78%)]" />
        <div className="relative max-w-[62%] p-6 md:p-8">
          <p className="text-micro font-semibold uppercase tracking-[0.2em] text-cherry">{fields.eyebrow || "Надпись над заголовком"}</p>
          <p className="mt-2 text-balance text-[26px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink md:text-[34px]">
            {fields.title || "Заголовок слайда"}
          </p>
          <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-ink-2">{fields.text || "Короткий текст под заголовком."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-plum-deep px-4 py-2.5 text-micro font-bold uppercase tracking-[0.1em] text-[#F7EFF4]">
              {fields.buttonLabel || "Кнопка"}
            </span>
            {fields.secondaryLabel && (
              <span className="rounded-full border border-plum/35 bg-paper/50 px-4 py-2.5 text-micro font-bold uppercase tracking-[0.1em] text-ink">
                {fields.secondaryLabel}
              </span>
            )}
          </div>
          <p className="mt-5 border-t border-ink/15 pt-2 text-micro font-bold uppercase tracking-[0.1em] text-ink-2">
            {fields.tabLabel || "Вкладка"}
          </p>
        </div>
      </div>

      <section className={adminPanelClass}>
        <label className="block">
          <span className="flex items-center justify-between gap-3"><span className={adminLabelClass}>Подпись вкладки</span>{counter(fields.tabLabel, HERO_SLIDE_LIMITS.tabLabel)}</span>
          <input required maxLength={HERO_SLIDE_LIMITS.tabLabel} value={fields.tabLabel} onChange={set("tabLabel")} placeholder="Свой вок" className={adminFieldClass} />
          <span className="mt-1.5 block text-xs text-ink-3">Коротко — видна внизу главного экрана рядом с полосой прогресса.</span>
        </label>
        <label className="block">
          <span className="flex items-center justify-between gap-3"><span className={adminLabelClass}>Надпись над заголовком</span>{counter(fields.eyebrow, HERO_SLIDE_LIMITS.eyebrow)}</span>
          <input required maxLength={HERO_SLIDE_LIMITS.eyebrow} value={fields.eyebrow} onChange={set("eyebrow")} placeholder="Конструктор вока" className={adminFieldClass} />
        </label>
        <label className="block md:col-span-2">
          <span className="flex items-center justify-between gap-3"><span className={adminLabelClass}>Заголовок</span>{counter(fields.title, HERO_SLIDE_LIMITS.title)}</span>
          <input required maxLength={HERO_SLIDE_LIMITS.title} value={fields.title} onChange={set("title")} placeholder="Ваш вок. Ваши правила." className={adminFieldClass} />
          <span className="mt-1.5 block text-xs text-ink-3">Короткий заголовок набирается крупнее — до 24 символов самый большой кегль.</span>
        </label>
        <label className="block md:col-span-2">
          <span className="flex items-center justify-between gap-3"><span className={adminLabelClass}>Текст</span>{counter(fields.text, HERO_SLIDE_LIMITS.text)}</span>
          <textarea required maxLength={HERO_SLIDE_LIMITS.text} rows={3} value={fields.text} onChange={set("text")} className={adminFieldClass} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Главная кнопка</span>
          <input required maxLength={HERO_SLIDE_LIMITS.buttonLabel} value={fields.buttonLabel} onChange={set("buttonLabel")} placeholder="Собрать вок" className={adminFieldClass} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Куда ведёт главная кнопка</span>
          <input required maxLength={300} value={fields.buttonHref} onChange={set("buttonHref")} placeholder="/wok-builder или https://…" className={adminFieldClass} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Вторая кнопка · необязательно</span>
          <input maxLength={HERO_SLIDE_LIMITS.buttonLabel} value={fields.secondaryLabel} onChange={set("secondaryLabel")} placeholder="Всё меню" className={adminFieldClass} />
        </label>
        <label className="block">
          <span className={adminLabelClass}>Куда ведёт вторая кнопка</span>
          <input maxLength={300} value={fields.secondaryHref} onChange={set("secondaryHref")} placeholder="/menu" className={adminFieldClass} />
        </label>
      </section>

      <section className={adminPanelClass}>
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Фотография</span>
          <p className="mb-2 text-xs text-ink-3">
            Горизонтальная, главное — справа: левая половина уходит под светлый градиент с текстом. Без своей — бренд-фото «Азия встречает Европу».
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <AdminImageUploader folder="banners" onUploaded={(url) => setImageUrl(url)} />
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">
                Убрать фото
              </button>
            )}
          </div>
        </div>
        <label className="block">
          <span className={adminLabelClass}>Порядок</span>
          <input type="number" min={0} max={999} step={1} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={adminFieldClass} />
          <span className="mt-1.5 block text-xs text-ink-3">Меньше — раньше. Порядок удобнее менять стрелками в списке слайдов.</span>
        </label>
        <div className="flex items-center justify-between gap-4 self-end rounded-2xl border border-hair bg-paper px-4 py-3">
          <span>
            <span className="block text-sm font-semibold">Показывать на главной</span>
            <span className="block text-xs text-ink-3">{isActive ? "Слайд в показе" : "Слайд скрыт"}</span>
          </span>
          <AdminSwitch checked={isActive} onChange={setIsActive} label="Показывать слайд на главной" />
        </div>
      </section>

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/banners/hero")} className="min-h-11 rounded-full border border-hair px-6 text-xs font-bold uppercase tracking-[0.1em]">
          Отмена
        </button>
        <button disabled={busy} className="min-h-11 rounded-full bg-plum-deep px-7 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">
          {busy ? "Сохраняем…" : id ? "Сохранить" : "Добавить слайд"}
        </button>
      </div>
    </form>
  );
}

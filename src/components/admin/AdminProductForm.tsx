"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import {
  createAdminProduct,
  type AdminProductInput,
  updateAdminProduct,
} from "@/server/adminProducts";

type CategoryOption = { id: string; name: string };
type ImageDraft = { key: string; url: string; alt: string };
type ProductDraft = Omit<AdminProductInput, "images"> & { id?: string; images: ImageDraft[] };

const fieldClass = "w-full rounded-2xl border border-hair bg-paper-2 px-4 py-3 text-sm outline-none transition focus:border-plum";
const labelClass = "mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-ink-2";
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function AdminProductForm({
  categories,
  initial,
}: {
  categories: CategoryOption[];
  initial?: ProductDraft;
}) {
  const router = useRouter();
  const [images, setImages] = useState<ImageDraft[]>(initial?.images ?? []);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function addImage(url = "", alt = "") {
    setImages((current) => [...current, { key: crypto.randomUUID(), url, alt }]);
  }

  function patchImage(key: string, patch: Partial<ImageDraft>) {
    setImages((current) => current.map((image) => image.key === key ? { ...image, ...patch } : image));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminProductInput = {
      slug: String(form.get("slug") ?? ""),
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      weight: String(form.get("weight") ?? ""),
      priceCents: Number(form.get("priceCents")),
      karma: Number(form.get("karma")),
      badge: (String(form.get("badge") ?? "") || null) as AdminProductInput["badge"],
      categoryId: String(form.get("categoryId") ?? ""),
      isStopList: form.get("isStopList") === "on",
      isHidden: form.get("isHidden") === "on",
      images: images.map((image, sortOrder) => ({ url: image.url, alt: image.alt, sortOrder })),
    };
    setError("");
    startTransition(async () => {
      const result = initial?.id
        ? await updateAdminProduct(initial.id, input)
        : await createAdminProduct(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="grid gap-5 rounded-[28px] border border-hair bg-paper-2 p-5 md:grid-cols-2 md:p-7">
        <label className="block">
          <span className={labelClass}>Название</span>
          <input name="name" required maxLength={80} defaultValue={initial?.name} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Slug</span>
          <input name="slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={initial?.slug} className={fieldClass} />
          {initial?.slug && !validSlug.test(initial.slug) && (
            <span className="mt-1 block text-xs text-cherry">Это старый slug с кириллицей. Перед сохранением замените его на латиницу.</span>
          )}
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>Описание</span>
          <textarea name="description" required maxLength={600} rows={5} defaultValue={initial?.description} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Вес / объём</span>
          <input name="weight" required maxLength={40} defaultValue={initial?.weight} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Категория</span>
          <select name="categoryId" required defaultValue={initial?.categoryId ?? categories[0]?.id} className={fieldClass}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Цена, копейки</span>
          <input name="priceCents" type="number" min={0} max={10_000_000} step={1} required defaultValue={initial?.priceCents ?? 0} className={fieldClass} />
          <span className="mt-1 block text-xs text-ink-3">Например, 64900 = 649 ₽</span>
        </label>
        <label className="block">
          <span className={labelClass}>Баллы кармы</span>
          <input name="karma" type="number" min={0} step={1} required defaultValue={initial?.karma ?? 0} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Бейдж</span>
          <select name="badge" defaultValue={initial?.badge ?? ""} className={fieldClass}>
            <option value="">Без бейджа</option>
            <option value="HIT">Хит</option>
            <option value="NEW">Новинка</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-3 pb-1 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm"><input name="isStopList" type="checkbox" defaultChecked={initial?.isStopList} /> Стоп-лист</label>
          <label className="flex items-center gap-2 text-sm"><input name="isHidden" type="checkbox" defaultChecked={initial?.isHidden} /> Скрыть из каталога</label>
        </div>
      </section>

      <section className="rounded-[28px] border border-hair bg-paper-2 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Изображения</h2>
            <p className="mt-1 text-sm text-ink-2">Первое изображение используется как главное.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addImage()} className="rounded-full border border-hair px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] hover:border-plum">Добавить URL</button>
            <AdminImageUploader onUploaded={(url, alt) => addImage(url, alt)} />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {images.length === 0 && <p className="rounded-2xl bg-paper-3 px-4 py-6 text-center text-sm text-ink-2">Изображений пока нет.</p>}
          {images.map((image, index) => (
            <div key={image.key} className="grid gap-4 rounded-2xl border border-hair p-4 md:grid-cols-[112px_1fr_auto] md:items-center">
              <div
                role="img"
                aria-label={image.alt || `Изображение ${index + 1}`}
                className="aspect-square rounded-xl bg-paper-3 bg-cover bg-center"
                style={image.url ? { backgroundImage: `url(${JSON.stringify(image.url).slice(1, -1)})` } : undefined}
              />
              <div className="grid gap-3">
                <label>
                  <span className={labelClass}>URL</span>
                  <input value={image.url} onChange={(event) => patchImage(image.key, { url: event.target.value })} className={fieldClass} />
                </label>
                <label>
                  <span className={labelClass}>Alt-текст</span>
                  <input value={image.alt} maxLength={160} onChange={(event) => patchImage(image.key, { alt: event.target.value })} className={fieldClass} />
                </label>
              </div>
              <div className="flex gap-2 md:flex-col">
                <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Поднять изображение" className="rounded-full border border-hair px-3 py-2 disabled:opacity-30">↑</button>
                <button type="button" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Опустить изображение" className="rounded-full border border-hair px-3 py-2 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => setImages((current) => current.filter((item) => item.key !== image.key))} className="rounded-full border border-cherry/30 px-3 py-2 text-cherry">×</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button type="submit" disabled={pending || categories.length === 0} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">
          {pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать товар"}
        </button>
      </div>
    </form>
  );
}

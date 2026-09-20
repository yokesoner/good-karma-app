"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import {
  CATEGORY_THEME_KEYS,
  CATEGORY_THEME_LABELS,
  CATEGORY_ACCENT_TINT_KEYS,
  CATEGORY_ACCENT_TINT_LABELS,
  CATEGORY_PATTERN_KEYS,
  CATEGORY_PATTERN_LABELS,
  DEFAULT_CATEGORY_THEME,
  DEFAULT_CATEGORY_ACCENT_TINT,
  DEFAULT_CATEGORY_PATTERN,
} from "@/lib/categoryThemes";
import { createAdminCategory, type AdminCategoryInput, updateAdminCategory } from "@/server/adminCategories";

export function AdminCategoryForm({ initial }: { initial?: AdminCategoryInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nullable = (name: string) => String(form.get(name) ?? "").trim() || null;
    const input: AdminCategoryInput = {
      id: String(form.get("id") ?? ""),
      name: String(form.get("name") ?? ""),
      sortOrder: Number(form.get("sortOrder")),
      theme: String(form.get("theme") ?? "") as AdminCategoryInput["theme"],
      accentTint: String(form.get("accentTint") ?? "") as AdminCategoryInput["accentTint"],
      pattern: String(form.get("pattern") ?? "") as AdminCategoryInput["pattern"],
      jpTagline: nullable("jpTagline"),
      tagline: nullable("tagline"),
      imageUrl,
    };
    setError("");
    startTransition(async () => {
      const result = initial ? await updateAdminCategory(initial.id, input) : await createAdminCategory(input);
      if (!result.ok) return setError(result.error);
      router.push("/admin/categories");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label><span className={adminLabelClass}>ID</span><input name="id" required maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" readOnly={!!initial} defaultValue={initial?.id} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Название</span><input name="name" required maxLength={80} defaultValue={initial?.name} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Порядок</span><input name="sortOrder" type="number" min={-1000} max={1000} step={1} required defaultValue={initial?.sortOrder ?? 0} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Тема</span><select name="theme" defaultValue={initial?.theme ?? DEFAULT_CATEGORY_THEME} className={adminFieldClass}>{CATEGORY_THEME_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_THEME_LABELS[key]}</option>)}</select></label>
        <label><span className={adminLabelClass}>Accent tint</span><select name="accentTint" defaultValue={initial?.accentTint ?? DEFAULT_CATEGORY_ACCENT_TINT} className={adminFieldClass}>{CATEGORY_ACCENT_TINT_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_ACCENT_TINT_LABELS[key]}</option>)}</select></label>
        <label><span className={adminLabelClass}>Паттерн</span><select name="pattern" defaultValue={initial?.pattern ?? DEFAULT_CATEGORY_PATTERN} className={adminFieldClass}>{CATEGORY_PATTERN_KEYS.map((key) => <option key={key} value={key}>{CATEGORY_PATTERN_LABELS[key]}</option>)}</select></label>
        <label><span className={adminLabelClass}>Японская подпись</span><input name="jpTagline" maxLength={80} defaultValue={initial?.jpTagline ?? ""} className={adminFieldClass} /></label>
        <label><span className={adminLabelClass}>Слоган</span><input name="tagline" maxLength={160} defaultValue={initial?.tagline ?? ""} className={adminFieldClass} /></label>
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Фото визуального мира категории</span>
          <p className="mb-2 text-xs text-ink-3">Если не задано, страница категории по-прежнему берёт фото первого товара.</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- превью произвольного S3-URL, next/image тут не нужен */
              <img src={imageUrl} alt="" className="h-16 w-16 rounded-2xl border border-hair object-cover" />
            )}
            <AdminImageUploader folder="categories" onUploaded={(url) => setImageUrl(url)} />
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">Убрать</button>
            )}
          </div>
        </div>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/categories")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Отмена</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : initial ? "Сохранить" : "Создать"}</button>
      </div>
    </form>
  );
}

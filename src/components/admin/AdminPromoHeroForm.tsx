"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminFieldClass, adminLabelClass, adminPanelClass } from "@/components/admin/formStyles";
import { AdminImageUploader } from "@/components/admin/AdminImageUploader";
import { type AdminPromoHeroBannerInput, updatePromoHeroBanner } from "@/server/adminPromotions";

export function AdminPromoHeroForm({ initial }: { initial: AdminPromoHeroBannerInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: AdminPromoHeroBannerInput = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      imageUrl,
    };
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updatePromoHeroBanner(input);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className={adminPanelClass}>
        <label className="md:col-span-2"><span className={adminLabelClass}>Заголовок</span><input name="title" required maxLength={120} defaultValue={initial.title} className={adminFieldClass} /></label>
        <label className="md:col-span-2"><span className={adminLabelClass}>Описание</span><textarea name="description" required maxLength={400} rows={4} defaultValue={initial.description} className={adminFieldClass} /></label>
        <div className="md:col-span-2">
          <span className={adminLabelClass}>Фоновая картинка</span>
          <p className="mb-2 text-xs text-ink-3">Если не задать — останется текущая (заглушка из реестра ассетов).</p>
          <div className="flex flex-wrap items-center gap-3">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- превью произвольного S3-URL, next/image тут не нужен */
              <img src={imageUrl} alt="" className="h-16 w-28 rounded-2xl border border-hair object-cover" />
            )}
            <AdminImageUploader folder="promotions" onUploaded={(url) => setImageUrl(url)} />
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-semibold text-cherry hover:underline">Убрать</button>
            )}
          </div>
        </div>
      </section>
      {error && <p role="alert" className="rounded-2xl bg-tint-blush px-5 py-4 text-sm text-cherry">{error}</p>}
      {saved && !error && <p className="rounded-2xl bg-tint-mint px-5 py-4 text-sm">Сохранено.</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/promotions")} className="rounded-full border border-hair px-6 py-3 text-xs font-bold uppercase tracking-[0.1em]">Назад</button>
        <button disabled={pending} className="rounded-full bg-plum-deep px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg disabled:opacity-50">{pending ? "Сохраняем…" : "Сохранить"}</button>
      </div>
    </form>
  );
}

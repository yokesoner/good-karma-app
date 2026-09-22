import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBannerForm } from "@/components/admin/AdminBannerForm";
import { ArrowLeft } from "@/components/icons";
import { BANNER_KEYS, getBannerSlot } from "@/lib/bannerSlots";
import { getBanner, getBannerOverrideKeys } from "@/server/siteBanners";

export const metadata: Metadata = { title: "Баннер — админка Гуд Карма" };

export default async function AdminBannerEditPage({ params }: { params: { key: string } }) {
  const slot = getBannerSlot(params.key);
  if (!slot || !(BANNER_KEYS as readonly string[]).includes(slot.key)) notFound();

  const [content, customized] = await Promise.all([
    getBanner(slot.key as (typeof BANNER_KEYS)[number]),
    getBannerOverrideKeys(),
  ]);
  const isCustom = customized.has(slot.key);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/banners" className="inline-flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Баннеры
      </Link>
      <h1 className="mt-3 text-[28px] font-semibold tracking-tight md:text-4xl">{slot.name}</h1>
      <p className="mb-5 mt-1.5 text-[13px] leading-snug text-ink-2">{slot.where}</p>
      {/* key: после сохранения или сброса форма пересоздаётся, чтобы
          неуправляемые поля показали актуальные значения. */}
      <AdminBannerForm key={isCustom ? "custom" : "default"} slot={slot} initial={content} customized={isCustom} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeroSlideForm } from "@/components/admin/AdminHeroSlideForm";
import { ArrowLeft } from "@/components/icons";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Слайд главного экрана — админка Гуд Карма" };

export default async function EditHeroSlidePage({ params }: { params: { id: string } }) {
  const slide = await db.heroSlide.findUnique({ where: { id: params.id } });
  if (!slide) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/banners/hero" className="inline-flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Главный экран
      </Link>
      <h1 className="mb-6 mt-3 text-[28px] font-semibold tracking-tight md:text-4xl">{slide.title}</h1>
      <AdminHeroSlideForm
        id={slide.id}
        initial={{
          tabLabel: slide.tabLabel,
          eyebrow: slide.eyebrow,
          title: slide.title,
          text: slide.text,
          buttonLabel: slide.buttonLabel,
          buttonHref: slide.buttonHref,
          secondaryLabel: slide.secondaryLabel ?? "",
          secondaryHref: slide.secondaryHref ?? "",
          imageUrl: slide.imageUrl,
          isActive: slide.isActive,
          sortOrder: slide.sortOrder,
        }}
      />
    </div>
  );
}

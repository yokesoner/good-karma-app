import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeroSlideForm } from "@/components/admin/AdminHeroSlideForm";
import { ArrowLeft } from "@/components/icons";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Новый слайд — админка Гуд Карма" };

export default async function NewHeroSlidePage() {
  // Новый слайд — в конец списка.
  const last = await db.heroSlide.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/banners/hero" className="inline-flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Главный экран
      </Link>
      <h1 className="mb-6 mt-3 text-[28px] font-semibold tracking-tight md:text-4xl">Новый слайд</h1>
      <AdminHeroSlideForm
        initial={{
          tabLabel: "",
          eyebrow: "",
          title: "",
          text: "",
          buttonLabel: "",
          buttonHref: "",
          secondaryLabel: "",
          secondaryHref: "",
          imageUrl: null,
          isActive: true,
          sortOrder: last ? last.sortOrder + 1 : 0,
        }}
      />
    </div>
  );
}

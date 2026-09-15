import type { Metadata } from "next";
import Link from "next/link";
import { AdminPromoHeroForm } from "@/components/admin/AdminPromoHeroForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Главный баннер — админка Гуд Карма" };

const FALLBACK = {
  title: "Всё хорошее возвращается",
  description: "Особенные предложения, любимые блюда и подарки за вашу карму. Маленькие поводы радовать себя чаще.",
  imageUrl: null as string | null,
};

export default async function AdminPromoHeroBannerPage() {
  const banner = await db.promoHeroBanner.findUnique({ where: { id: "singleton" } });
  return (
    <div>
      <Link href="/admin/promotions" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Акции</Link>
      <h1 className="mb-2 mt-4 text-4xl font-semibold tracking-tight">Главный баннер</h1>
      <p className="mb-8 text-sm text-ink-2">Редакционный блок вверху публичной страницы /promotions — один на весь сайт.</p>
      <AdminPromoHeroForm initial={banner ?? FALLBACK} />
    </div>
  );
}

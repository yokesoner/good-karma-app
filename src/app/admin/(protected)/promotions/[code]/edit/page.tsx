import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPromotionForm } from "@/components/admin/AdminPromotionForm";
import { db } from "@/lib/db";
import type { PromoBackgroundKey } from "@/lib/promoBackgrounds";

export const metadata: Metadata = { title: "Редактирование акции — админка Гуд Карма" };

export default async function EditAdminPromotionPage({ params }: { params: { code: string } }) {
  const [promotion, products] = await Promise.all([db.promotion.findUnique({ where: { code: params.code } }), db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  if (!promotion) notFound();
  return <div><Link href="/admin/promotions" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все акции</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">{promotion.title}</h1><AdminPromotionForm products={products} initial={{ code: promotion.code, type: promotion.type, discountPct: promotion.discountPct, discountFixedCents: promotion.discountFixedCents, minOrderCents: promotion.minOrderCents, title: promotion.title, description: promotion.description, featuredImageProductId: promotion.featuredImageProductId, imageUrl: promotion.imageUrl, backgroundKey: promotion.backgroundKey as PromoBackgroundKey | null, activeFrom: promotion.activeFrom?.toISOString() ?? null, activeTo: promotion.activeTo?.toISOString() ?? null, isActive: promotion.isActive, recurrence: promotion.recurrence, recurrenceStartTime: promotion.recurrenceStartTime, recurrenceEndTime: promotion.recurrenceEndTime, recurrenceWeekdays: promotion.recurrenceWeekdays, recurrenceDayOfMonth: promotion.recurrenceDayOfMonth, label: promotion.label, showOnHome: promotion.showOnHome, sortOrder: promotion.sortOrder }} /></div>;
}

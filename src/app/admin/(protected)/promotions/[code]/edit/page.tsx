import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPromotionForm } from "@/components/admin/AdminPromotionForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование акции — админка Гуд Карма" };

export default async function EditAdminPromotionPage({ params }: { params: { code: string } }) {
  const [promotion, products] = await Promise.all([db.promotion.findUnique({ where: { code: params.code } }), db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  if (!promotion) notFound();
  return <div><Link href="/admin/promotions" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все акции</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">{promotion.title}</h1><AdminPromotionForm products={products} initial={{ code: promotion.code, type: promotion.type, discountPct: promotion.discountPct, minOrderCents: promotion.minOrderCents, title: promotion.title, description: promotion.description, featuredImageProductId: promotion.featuredImageProductId, activeFrom: promotion.activeFrom?.toISOString() ?? null, activeTo: promotion.activeTo?.toISOString() ?? null, isActive: promotion.isActive }} /></div>;
}

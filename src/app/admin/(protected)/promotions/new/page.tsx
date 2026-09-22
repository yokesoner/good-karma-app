import type { Metadata } from "next";
import Link from "next/link";
import { AdminPromotionForm } from "@/components/admin/AdminPromotionForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Новая акция — админка Гуд Карма" };

export default async function NewAdminPromotionPage() {
  const products = await db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <div><Link href="/admin/promotions" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все акции</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новая акция</h1><AdminPromotionForm products={products} /></div>;
}

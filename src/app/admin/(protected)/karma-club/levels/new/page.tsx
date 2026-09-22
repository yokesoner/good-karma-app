import type { Metadata } from "next";
import Link from "next/link";
import { AdminKarmaLevelForm } from "@/components/admin/AdminKarmaLevelForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Новый уровень — админка Гуд Карма" };
export default async function NewAdminKarmaLevelPage() {
  const products = await db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новый уровень</h1><AdminKarmaLevelForm products={products} /></div>;
}

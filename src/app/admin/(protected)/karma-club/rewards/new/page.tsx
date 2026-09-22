import type { Metadata } from "next";
import Link from "next/link";
import { AdminKarmaRewardForm } from "@/components/admin/AdminKarmaRewardForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Новая награда — админка Гуд Карма" };
export default async function NewAdminKarmaRewardPage() {
  const [products, levels] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" }, select: { key: true, name: true } }),
  ]);
  return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новая награда</h1><AdminKarmaRewardForm products={products} levels={levels} /></div>;
}

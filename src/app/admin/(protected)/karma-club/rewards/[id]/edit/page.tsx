import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminKarmaRewardForm } from "@/components/admin/AdminKarmaRewardForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование награды — админка Гуд Карма" };
export default async function EditAdminKarmaRewardPage({ params }: { params: { id: string } }) {
  const [reward, products, levels] = await Promise.all([
    db.karmaReward.findUnique({ where: { id: params.id }, include: { products: { select: { productId: true } } } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.karmaLevel.findMany({ orderBy: { fromKarma: "asc" }, select: { key: true, name: true } }),
  ]);
  if (!reward) notFound();
  return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">{reward.title}</h1><AdminKarmaRewardForm id={reward.id} products={products} levels={levels} initial={{ costPoints: reward.costPoints, title: reward.title, description: reward.description, isActive: reward.isActive, kind: reward.kind, productIds: reward.products.map((p) => p.productId), discountType: reward.discountType, discountPct: reward.discountPct, discountFixedCents: reward.discountFixedCents, minLevelKey: reward.minLevelKey, maxRedemptionsPerWeek: reward.maxRedemptionsPerWeek }} /></div>;
}

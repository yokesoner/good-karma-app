import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCategoryForm } from "@/components/admin/AdminCategoryForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование категории — админка Гуд Карма" };

export default async function EditAdminCategoryPage({ params }: { params: { id: string } }) {
  const category = await db.category.findUnique({ where: { id: params.id }, include: { meta: true } });
  if (!category) notFound();
  return <div><Link href="/admin/categories" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все категории</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">{category.name}</h1><AdminCategoryForm initial={{ id: category.id, name: category.name, sortOrder: category.sortOrder, theme: category.meta?.theme ?? "calm", accentTint: category.meta?.accentTint ?? "ivory", pattern: category.meta?.pattern ?? "none", jpTagline: category.meta?.jpTagline ?? null, tagline: category.meta?.tagline ?? null }} /></div>;
}

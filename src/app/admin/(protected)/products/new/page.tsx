import type { Metadata } from "next";
import Link from "next/link";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Новый товар — админка Гуд Карма" };

export default async function NewAdminProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div>
      <Link href="/admin/products" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все товары</Link>
      <h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">Новый товар</h1>
      <AdminProductForm categories={categories} />
    </div>
  );
}

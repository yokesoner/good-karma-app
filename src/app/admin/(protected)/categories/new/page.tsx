import type { Metadata } from "next";
import Link from "next/link";
import { AdminCategoryForm } from "@/components/admin/AdminCategoryForm";

export const metadata: Metadata = { title: "Новая категория — админка Гуд Карма" };

export default function NewAdminCategoryPage() {
  return <div><Link href="/admin/categories" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все категории</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новая категория</h1><AdminCategoryForm /></div>;
}

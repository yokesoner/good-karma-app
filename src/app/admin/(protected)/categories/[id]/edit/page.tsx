import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCategoryForm } from "@/components/admin/AdminCategoryForm";
import type { AdminCategoryInput } from "@/server/adminCategories";
import { DEFAULT_CATEGORY_THEME, DEFAULT_CATEGORY_ACCENT_TINT, DEFAULT_CATEGORY_PATTERN } from "@/lib/categoryThemes";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование категории — админка Гуд Карма" };

export default async function EditAdminCategoryPage({ params }: { params: { id: string } }) {
  const category = await db.category.findUnique({ where: { id: params.id }, include: { meta: true } });
  if (!category) notFound();
  // CategoryMeta.theme/accentTint/pattern в БД — обычные String-колонки
  // (без Postgres-enum), закрытый список — только на уровне zod
  // (src/server/adminCategories.ts) и формы. Приведение типа здесь —
  // тот же приём, что уже есть у backgroundKey в форме акций: если в
  // базе окажется значение вне текущего набора, форма просто покажет
  // дефолт вместо падения.
  const theme = (category.meta?.theme ?? DEFAULT_CATEGORY_THEME) as AdminCategoryInput["theme"];
  const accentTint = (category.meta?.accentTint ?? DEFAULT_CATEGORY_ACCENT_TINT) as AdminCategoryInput["accentTint"];
  const pattern = (category.meta?.pattern ?? DEFAULT_CATEGORY_PATTERN) as AdminCategoryInput["pattern"];
  return <div><Link href="/admin/categories" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все категории</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">{category.name}</h1><AdminCategoryForm initial={{ id: category.id, name: category.name, sortOrder: category.sortOrder, theme, accentTint, pattern, jpTagline: category.meta?.jpTagline ?? null, tagline: category.meta?.tagline ?? null, imageUrl: category.meta?.imageUrl ?? null }} /></div>;
}

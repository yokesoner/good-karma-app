import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { db } from "@/lib/db";
import { deleteAdminCategory } from "@/server/adminCategories";

export const metadata: Metadata = { title: "Категории — админка Гуд Карма" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { meta: true, _count: { select: { products: true } } } });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Каталог</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Категории</h1><p className="mt-2 text-sm text-ink-2">{categories.length} разделов</p></div>
        <Link href="/admin/categories/new" className="rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить категорию</Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
        {categories.map((category) => (
          <article key={category.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_100px_1fr_170px] md:items-center">
            <div><h2 className="font-semibold">{category.name}</h2><p className="mt-1 text-xs text-ink-3">{category.id} · {category._count.products} товаров</p></div>
            <p className="text-sm text-ink-2">Порядок: {category.sortOrder}</p>
            <p className="text-sm text-ink-2">{category.meta ? `${category.meta.theme} · ${category.meta.pattern}` : "Мета не задана"}</p>
            <div className="flex items-center justify-end gap-4"><Link href={`/admin/categories/${category.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link><AdminDeleteButton identifier={category.id} label={category.name} action={deleteAdminCategory} /></div>
          </article>
        ))}
        {categories.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Категорий пока нет.</p>}
      </div>
    </div>
  );
}

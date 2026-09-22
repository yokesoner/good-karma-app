import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { db } from "@/lib/db";
import { deleteAdminProduct } from "@/server/adminProducts";

export const metadata: Metadata = { title: "Редактирование товара — админка Гуд Карма" };

export default async function EditAdminProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id: params.id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Меню</Link>
      <h1 className="mb-6 mt-4 text-[28px] font-semibold tracking-tight md:mb-8 md:text-4xl">{product.name}</h1>
      <AdminProductForm
        categories={categories}
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          weight: product.weight,
          priceCents: product.priceCents,
          karma: product.karma,
          badge: product.badge,
          categoryId: product.categoryId,
          isStopList: product.isStopList,
          isHidden: product.isHidden,
          images: product.images.map((image) => ({ key: image.id, url: image.url, alt: image.alt })),
        }}
      />
      {/* Удаление переехало сюда из списка: в компактном меню ему не место —
          случайно задеть рядом с ползунком стопа было бы слишком легко. */}
      <div className="mt-8 flex items-center justify-between gap-4 rounded-[22px] border border-hair bg-paper-2 p-5">
        <div>
          <p className="text-sm font-semibold">Удалить блюдо</p>
          <p className="mt-1 text-xs text-ink-3">Если блюдо уже было в заказах, вместо удаления включите «Скрыть из каталога».</p>
        </div>
        <AdminDeleteButton identifier={product.id} label={product.name} action={deleteAdminProduct} redirectTo="/admin/products" className="shrink-0" />
      </div>
    </div>
  );
}

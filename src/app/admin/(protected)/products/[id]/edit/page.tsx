import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование товара — админка Гуд Карма" };

export default async function EditAdminProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id: params.id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все товары</Link>
      <h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">{product.name}</h1>
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
    </div>
  );
}

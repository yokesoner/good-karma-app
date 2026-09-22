import type { Metadata } from "next";
import Link from "next/link";
import { AdminMenuManager } from "@/components/admin/AdminMenuManager";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Меню — админка Гуд Карма" };

export default async function AdminProductsPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        orderBy: { name: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Каталог и стоп-лист</p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-4xl">Меню</h1>
        </div>
        <Link
          href="/admin/products/new"
          className="shrink-0 rounded-full bg-plum-deep px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-btn-fg transition active:scale-95 md:px-6 md:py-3 md:text-xs"
        >
          + Блюдо
        </Link>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink-2">
        Ползунок справа — блюдо в продаже или на стопе. Ползунок у категории ставит на стоп все её блюда сразу.
      </p>

      <div className="mt-5">
        <AdminMenuManager
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            isStopList: category.isStopList,
            products: category.products.map((product) => ({
              id: product.id,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.images[0]?.url ?? null,
              isStopList: product.isStopList,
              isHidden: product.isHidden,
            })),
          }))}
        />
      </div>
    </div>
  );
}

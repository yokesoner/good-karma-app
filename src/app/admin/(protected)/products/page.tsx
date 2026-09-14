import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteProductButton } from "@/components/admin/AdminDeleteProductButton";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Товары — админка Гуд Карма" };

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: {
      category: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Каталог</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Товары</h1>
          <p className="mt-2 text-sm text-ink-2">{products.length} позиций</p>
        </div>
        <Link href="/admin/products/new" className="rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить товар</Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
        <div className="hidden grid-cols-[72px_1fr_160px_120px_150px] gap-4 border-b border-hair px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 lg:grid">
          <span>Фото</span><span>Товар</span><span>Категория</span><span>Цена</span><span className="text-right">Действия</span>
        </div>
        {products.map((product) => (
          <article key={product.id} className="grid gap-4 border-b border-hair p-5 last:border-b-0 sm:grid-cols-[72px_1fr_auto] sm:items-center lg:grid-cols-[72px_1fr_160px_120px_150px]">
            <div
              role="img"
              aria-label={product.images[0]?.alt || product.name}
              className="h-[72px] w-[72px] rounded-2xl bg-paper-3 bg-cover bg-center"
              style={product.images[0]?.url ? { backgroundImage: `url(${product.images[0].url})` } : undefined}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-semibold">{product.name}</h2>
                {product.badge && <span className="rounded-full bg-tint-blush px-2 py-1 text-[9px] font-bold text-cherry">{product.badge}</span>}
                {product.isStopList && <span className="rounded-full bg-tint-gold px-2 py-1 text-[9px] font-bold">СТОП</span>}
                {product.isHidden && <span className="rounded-full bg-paper-3 px-2 py-1 text-[9px] font-bold">СКРЫТ</span>}
              </div>
              <p className="mt-1 truncate text-xs text-ink-3">/{product.slug}</p>
            </div>
            <p className="text-sm text-ink-2">{product.category.name}</p>
            <p className="font-semibold">{formatMoney(product.priceCents)}</p>
            <div className="flex items-center justify-between gap-4 sm:col-start-2 lg:col-start-auto lg:justify-end">
              <Link href={`/admin/products/${product.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link>
              <AdminDeleteProductButton id={product.id} name={product.name} />
            </div>
          </article>
        ))}
        {products.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Каталог пуст.</p>}
      </div>
    </div>
  );
}

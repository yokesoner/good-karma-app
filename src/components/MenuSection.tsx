import Link from "next/link";
import { db } from "@/lib/db";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ProductCard } from "@/components/ProductCard";
import { CulinaryWorlds } from "@/components/CulinaryWorlds";

// Раньше этот запрос жил прямо в page.tsx. В App Router колокация данных
// с компонентом, которому они нужны, — идиоматичный паттерн: захочет кто-то
// вставить меню на другую страницу (например, в отдельный /menu) — просто
// переиспользует этот компонент, а не копирует запрос.
export async function MenuSection() {
  const [categories, featured] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        meta: true,
        products: {
          take: 1,
          orderBy: { createdAt: "asc" },
          include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
    db.product.findMany({
      where: { isHidden: false, isStopList: false },
      take: 8,
      orderBy: { ratingCount: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return (
    <section id="menu" className="mx-auto max-w-wrap px-5 py-14 md:px-16 md:py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 md:mb-10">
        <div>
          <span className="mb-3 block text-[10.5px] font-bold uppercase tracking-[0.2em] text-cherry">
            Меню как путешествие
          </span>
          <h2 className="max-w-[15ch] text-[34px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[48px]">
            Выберите своё настроение
          </h2>
        </div>
        <p className="max-w-[36ch] text-[13.5px] leading-relaxed text-ink-2">
          Два кулинарных мира встречаются на одной кухне — и не спорят,
          а дополняют друг друга.
        </p>
      </div>

      <CulinaryWorlds />

      <div className="mb-3 mt-10 flex items-end justify-between gap-4 md:mt-12">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
            Быстрый выбор
          </span>
          <h3 className="mt-1 text-[20px] font-bold tracking-tight">Все категории</h3>
        </div>
      </div>
      <CategoryStrip categories={categories} />

      <div className="mb-6 mt-12 flex items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
            Выбор гостей
          </span>
          <h3 className="mt-1 text-[24px] font-bold tracking-tight md:text-[28px]">Хиты кухни</h3>
        </div>
        <Link
          href="/menu"
          className="text-[11px] font-bold uppercase tracking-[0.1em] text-cherry hover:opacity-70"
        >
          Всё меню →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

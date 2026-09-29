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
      // Хиты не показываем, если блюдо или вся его категория на стопе.
      where: { isHidden: false, isStopList: false, category: { isStopList: false } },
      take: 8,
      orderBy: { ratingCount: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  return (
    <section id="menu" className="mx-auto max-w-wrap px-5 py-7 md:px-16 md:py-20">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-5 md:mb-10">
        <div>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-cherry md:mb-3 md:text-[10.5px]">
            Меню как путешествие
          </span>
          <h2 className="max-w-[15ch] text-[26px] font-bold leading-[1.06] tracking-[-0.035em] md:text-[48px] md:leading-[1.05]">
            Выберите своё настроение
          </h2>
        </div>
        <p className="hidden max-w-[36ch] text-[13.5px] leading-relaxed text-ink-2 md:block">
          Два кулинарных мира встречаются на одной кухне — и не спорят,
          а дополняют друг друга.
        </p>
      </div>

      <CulinaryWorlds />

      <div className="mb-1 mt-7 flex items-end justify-between gap-4 md:mb-3 md:mt-12">
        <div>
          <span className="text-micro font-bold uppercase tracking-[0.18em] text-ink-3">
            Быстрый выбор
          </span>
          <h3 className="mt-0.5 text-[18px] font-bold tracking-tight md:mt-1 md:text-[20px]">Все категории</h3>
        </div>
      </div>
      <CategoryStrip categories={categories} />

      <div className="mb-4 mt-7 flex items-end justify-between gap-4 md:mb-6 md:mt-12">
        <div>
          <span className="text-micro font-bold uppercase tracking-[0.18em] text-ink-3">
            Выбор гостей
          </span>
          <h3 className="mt-0.5 text-[20px] font-bold tracking-tight md:mt-1 md:text-[28px]">Хиты кухни</h3>
        </div>
        <Link
          href="/menu"
          className="text-[11px] font-bold uppercase tracking-[0.1em] text-cherry hover:opacity-70"
        >
          Всё меню →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
        {featured.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}

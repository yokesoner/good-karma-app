import Image from "next/image";
import Link from "next/link";
import type { Category, CategoryMeta, Product, ProductImage } from "@prisma/client";
import { categoryAccentTintClass } from "@/lib/categoryThemes";

type CategoryWithMeta = Category & {
  meta: CategoryMeta | null;
  products: (Product & { images: ProductImage[] })[];
};

// В прототипе catCardHTML() брала фото жёстко заданного "лицевого" блюда
// категории (catFace map). Здесь это первый товар категории — тот же
// эффект, но без ручной карты id, которая рассинхронизируется при первом
// же удалении товара из каталога.
export function CategoryStrip({ categories }: { categories: CategoryWithMeta[] }) {
  return (
    <div
      role="tablist"
      aria-label="Категории меню"
      className="flex gap-2 overflow-x-auto pb-3 pt-1 [scrollbar-width:none]"
    >
      {categories.map((c) => {
        const face = c.products[0]?.images[0];
        return (
          <Link
            key={c.id}
            href={`/menu/${c.id}`}
            role="tab"
            className="group w-[116px] flex-none rounded-[26px] border border-transparent px-2 pb-4 pt-2.5 text-center transition duration-500 hover:-translate-y-1 hover:border-white/80 hover:bg-white/55 hover:shadow-[0_18px_42px_-32px_rgba(73,48,68,.5)]"
          >
            <span className={`relative mb-3 block aspect-square overflow-hidden rounded-[34px] border border-white/80 p-1 shadow-s transition duration-500 group-hover:rotate-[-1.5deg] group-hover:shadow-m ${categoryAccentTintClass(c.meta?.accentTint)}`}>
              {face ? (
                <span className="relative block h-full w-full overflow-hidden rounded-[29px]">
                  <Image
                    src={face.url}
                    alt=""
                    fill
                    sizes="104px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
              ) : null}
            </span>
            <span className="block text-[11.5px] font-bold text-ink-2 transition group-hover:text-ink">
              {c.name}
            </span>
            {c.meta?.jpTagline ? (
              <span className="mt-1 block truncate text-[8.5px] tracking-[0.14em] text-ink-3/65">
                {c.meta.jpTagline}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

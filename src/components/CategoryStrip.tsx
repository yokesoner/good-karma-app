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
//
// На телефоне «пилюли» вдвое меньше (84 px вместо 116) и без японской
// подписи — в экран помещается 4 категории вместо 3, и ленту не нужно
// долго листать.
export function CategoryStrip({ categories }: { categories: CategoryWithMeta[] }) {
  return (
    <div
      role="tablist"
      aria-label="Категории меню"
      className="snap-row -mx-5 flex gap-1 overflow-x-auto px-5 pb-2 pt-1 md:mx-0 md:gap-2 md:px-0 md:pb-3"
    >
      {categories.map((c, index) => {
        const face = c.products[0]?.images[0];
        return (
          <Link
            key={c.id}
            href={`/menu/${c.id}`}
            role="tab"
            data-reveal="fade"
            style={{ "--reveal-delay": `${Math.min(index, 6) * 50}ms` } as React.CSSProperties}
            className="group w-[84px] flex-none rounded-[20px] border border-transparent px-1 pb-2 pt-1.5 text-center transition duration-300 active:scale-95 md:w-[116px] md:rounded-[26px] md:px-2 md:pb-4 md:pt-2.5 md:duration-500 md:hover:-translate-y-1 md:hover:border-white/80 md:hover:bg-white/55 md:hover:shadow-[0_18px_42px_-32px_rgba(73,48,68,.5)]"
          >
            <span className={`relative mb-2 block aspect-square overflow-hidden rounded-[26px] border border-white/80 p-[3px] shadow-s transition duration-500 md:mb-3 md:rounded-[34px] md:p-1 md:group-hover:rotate-[-1.5deg] md:group-hover:shadow-m ${categoryAccentTintClass(c.meta?.accentTint)} ${c.isStopList ? "opacity-60" : ""}`}>
              {face ? (
                <span className="relative block h-full w-full overflow-hidden rounded-[22px] md:rounded-[29px]">
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
            <span className="block text-[11px] font-bold text-ink-2 transition group-hover:text-ink md:text-[11.5px]">
              {c.name}
            </span>
            {c.meta?.jpTagline ? (
              <span className="mt-1 hidden truncate text-[8.5px] tracking-[0.14em] text-ink-3/65 md:block">
                {c.meta.jpTagline}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

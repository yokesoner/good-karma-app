import Image from "next/image";
import { Link } from "next-view-transitions";
import { formatMoney } from "@/lib/money";
import { QuickAddButton } from "@/components/QuickAddButton";
import type { Product, ProductImage } from "@prisma/client";

type ProductCardProps = {
  product: Product & { images: ProductImage[] };
  /** Вся категория блюда на стопе (Category.isStopList) — блюдо тоже недоступно. */
  categoryStopped?: boolean;
  /** Порядковый номер в сетке — для «лесенки» появления при прокрутке. */
  index?: number;
};

// Сохраняем быстрый «+» из прототипа и даём фотографии больше
// редакционного веса. На телефоне карточка заметно компактнее (фото
// квадратное, подписи мельче, описание в одну строку) — в сетке в два
// столбца на экране помещается вдвое больше блюд; на планшете и десктопе
// вид прежний (4:5).
export function ProductCard({ product, categoryStopped = false, index = 0 }: ProductCardProps) {
  const cover = product.images[0];
  const href = `/product/${product.slug}`;
  const unavailable = product.isStopList || categoryStopped;

  return (
    <article
      data-reveal
      style={{ "--reveal-delay": `${(index % 4) * 70}ms` } as React.CSSProperties}
      className={`group relative flex min-w-0 flex-col rounded-[22px] border border-white/70 bg-paper-2/90 p-1.5 shadow-[0_14px_44px_-34px_rgba(73,48,68,.62)] backdrop-blur-md transition duration-500 md:rounded-[30px] md:p-2 md:hover:-translate-y-1 md:hover:shadow-[0_28px_64px_-34px_rgba(73,48,68,.48)] ${
        unavailable ? "is-unavailable" : ""
      }`}
    >
      <Link
        href={href}
        className="relative aspect-square overflow-hidden rounded-[17px] border border-hair-soft bg-paper-3 shadow-s transition-transform duration-200 active:scale-[0.985] md:aspect-[4/5] md:rounded-[23px]"
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
            style={{ viewTransitionName: `product-photo-${product.slug}` }}
          />
        ) : null}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#21151F]/60 to-transparent" />
        {unavailable ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--glass)] px-2 py-1 text-micro font-bold uppercase tracking-[0.14em] text-ink backdrop-blur-md md:left-4 md:top-4 md:px-3 md:py-1.5">
            Нет в наличии
          </span>
        ) : product.badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--glass)] px-2 py-1 text-micro font-medium uppercase tracking-[0.16em] text-ink backdrop-blur-md md:left-4 md:top-4 md:px-3 md:py-1.5 md:tracking-[0.18em]">
            {product.badge === "HIT" ? "Хит" : "Новинка"}
          </span>
        ) : null}
        <span className="absolute bottom-2.5 left-2.5 rounded-full border border-white/20 bg-black/15 px-2 py-1 text-micro font-bold uppercase tracking-[0.1em] text-white/85 backdrop-blur-sm md:bottom-4 md:left-4 md:px-3 md:py-1.5 md:tracking-[0.13em]">
          {product.weight}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-0.5 px-1.5 pb-1.5 pt-2.5 md:gap-1 md:px-2 md:pb-2 md:pt-3.5">
        <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-3">
          <Link href={href} className="min-w-0">
            <h3 className="break-words text-[13px] font-bold leading-tight tracking-[-0.015em] hover:text-cherry sm:text-[15px] md:text-[16px]">
              {product.name}
            </h3>
          </Link>
          <span className="shrink-0 text-caption font-semibold text-ink-3">
            <span className="text-gold">★</span> {String(product.rating)}
          </span>
        </div>
        <p className="line-clamp-1 text-[11.5px] leading-snug text-ink-3 md:line-clamp-2 md:text-[13px]">
          {product.description}
        </p>
        <div className="mt-auto flex items-end gap-2 pt-2 md:pt-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold md:text-[15px]">{formatMoney(product.priceCents)}</span>
            <span className="mt-0.5 block truncate text-micro font-bold uppercase tracking-[0.1em] text-ink-3">
              +{product.karma} кармы
            </span>
          </div>
          <QuickAddButton
            productId={product.id}
            name={product.name}
            priceCents={product.priceCents}
            imageUrl={cover?.url ?? null}
            disabled={unavailable}
          />
        </div>
      </div>
    </article>
  );
}

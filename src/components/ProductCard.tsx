import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { QuickAddButton } from "@/components/QuickAddButton";
import type { Product, ProductImage } from "@prisma/client";

type ProductCardProps = {
  product: Product & { images: ProductImage[] };
};

// Сохраняем 4:5 и быстрый «+» из прототипа, но даём фотографии больше
// редакционного веса: метаданные живут прямо на кадре, а нижняя часть
// остаётся спокойной и хорошо сканируется в большой сетке.
export function ProductCard({ product }: ProductCardProps) {
  const cover = product.images[0];
  const href = `/product/${product.slug}`;

  return (
    <article className="group relative min-w-0 flex flex-col rounded-[30px] border border-white/70 bg-paper-2/88 p-2 shadow-[0_14px_44px_-34px_rgba(73,48,68,.62)] backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_64px_-34px_rgba(73,48,68,.48)]">
      <Link
        href={href}
        className="relative aspect-[4/5] overflow-hidden rounded-[23px] border border-hair-soft bg-paper-3 shadow-s"
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          />
        ) : null}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#21151F]/60 to-transparent" />
        {product.badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--glass)] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-ink backdrop-blur-md">
            {product.badge === "HIT" ? "Хит" : "Новинка"}
          </span>
        ) : null}
        <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/15 px-3 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.13em] text-white/85 backdrop-blur-sm">
          {product.weight}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 px-2 pb-2 pt-3.5">
        <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-3">
          <Link href={href} className="min-w-0">
            <h3 className="break-words text-[14px] font-bold leading-tight tracking-[-0.015em] hover:text-cherry sm:text-[15px] md:text-[16px]">
              {product.name}
            </h3>
          </Link>
          <span className="shrink-0 text-[9px] font-semibold text-ink-3 sm:text-[10.5px]">
            <span className="text-gold">★</span> {String(product.rating)}
          </span>
        </div>
        <p className="line-clamp-2 text-[13px] leading-snug text-ink-3">{product.description}</p>
        <div className="mt-auto flex items-end gap-2 pt-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">{formatMoney(product.priceCents)}</span>
            <span className="mt-0.5 block truncate text-[8px] font-bold uppercase tracking-[0.1em] text-ink-3 sm:text-[9px]">
              +{product.karma} кармы
            </span>
          </div>
          <QuickAddButton
            productId={product.id}
            name={product.name}
            priceCents={product.priceCents}
            imageUrl={cover?.url ?? null}
            disabled={product.isStopList}
          />
        </div>
      </div>
    </article>
  );
}

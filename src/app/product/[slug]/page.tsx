import Image from "next/image";
import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ArrowLeft } from "@/components/icons";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { SITE_URL } from "@/lib/siteUrl";

type Params = { params: { slug: string } };

async function getProduct(slug: string) {
  // В dev-режиме Next иногда передаёт кириллический сегмент ещё в percent-encoding.
  // Нормализуем его здесь: для уже декодированной строки операция безопасна.
  let normalizedSlug = slug;
  try {
    normalizedSlug = decodeURIComponent(slug);
  } catch {
    // Некорректный сегмент просто не найдётся в БД и штатно уйдёт в notFound().
  }

  return db.product.findUnique({
    where: { slug: normalizedSlug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      ingredients: { orderBy: { sortOrder: "asc" } },
      nutrition: true,
      category: true,
      addonGroups: {
        include: { addonGroup: { include: { addons: { orderBy: { sortOrder: "asc" } } } } },
      },
    },
  });
}

// Динамические метаданные — ровно то, чего не мог статический прототип:
// у каждого блюда своё превью при отправке ссылки в мессенджер.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Блюдо не найдено" };
  const image = product.images[0]?.url;
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const product = await getProduct(params.slug);
  if (!product || product.isHidden) notFound();

  const addons = product.addonGroups.flatMap((link) => link.addonGroup.addons);
  const cover = product.images[0];
  const unavailable = product.isStopList || product.category.isStopList;

  // Product + Offer, не Restaurant/MenuItem: блюда здесь не просто пункты
  // меню на бумаге, у них есть цена и их можно купить прямо на сайте —
  // то, для чего schema.org Product с ценой и наличием и предназначен.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: cover ? [cover.url.startsWith("http") ? cover.url : `${SITE_URL}${cover.url}`] : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "RUB",
      price: (product.priceCents / 100).toFixed(2),
      availability: unavailable ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(parseFloat(String(product.rating)) > 0 && product.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: String(product.rating), reviewCount: product.ratingCount } }
      : {}),
  };

  return (
    <main className="product-page mx-auto max-w-wrap px-5 py-3 md:px-16 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <Link
        href="/menu"
        className="inline-flex items-center gap-2 rounded-full border border-hair bg-paper-2/65 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 backdrop-blur-sm transition active:scale-95 hover:border-cherry/40 hover:text-ink md:px-4 md:py-2.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Назад в меню
      </Link>

      <div className="mt-3 grid grid-cols-1 gap-4 md:mt-6 md:gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="group relative aspect-[5/4] overflow-hidden rounded-[26px] border border-white/65 bg-paper-3 shadow-[0_38px_100px_-46px_rgba(53,29,45,.7)] md:aspect-[4/5] md:rounded-[38px]">
            {cover && (
              <Image
                src={cover.url}
                alt={cover.alt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-[900ms] group-hover:scale-[1.025]"
                style={{ viewTransitionName: `product-photo-${product.slug}` }}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#21151F]/65 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/80 md:bottom-6 md:left-6">
              <span className="rounded-full border border-white/20 bg-black/10 px-3 py-1.5 backdrop-blur-sm md:py-2">
                {product.weight}
              </span>
              <span className="rounded-full border border-white/20 bg-black/10 px-3 py-1.5 backdrop-blur-sm md:py-2">
                +{product.karma} кармы
              </span>
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.slice(1).map((img) => (
                <div
                  key={img.id}
                  className="relative h-16 w-16 overflow-hidden rounded-m bg-paper-3"
                >
                  <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-white/70 bg-paper-2/85 p-5 shadow-[0_30px_80px_-48px_rgba(73,48,68,.55)] backdrop-blur-xl md:rounded-[38px] md:p-10 lg:p-12">
          <span
            aria-hidden
            className="absolute -right-4 -top-12 text-[160px] font-bold leading-none text-plum/[0.035]"
          >
            味
          </span>
          <div className="relative">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-cherry">
              {product.category.name}
            </span>
            <span className="text-[12.5px] text-ink-3">
              <b className="text-[14px] font-bold text-ink">{String(product.rating)}</b>
              <span className="text-gold"> ★</span> · {product.ratingCount} оценок
            </span>
          </div>

          <h1 className="mt-3 max-w-[16ch] text-[28px] font-bold leading-[1.04] tracking-[-0.035em] md:mt-4 md:max-w-[12ch] md:text-[48px] md:tracking-[-0.04em]">
            {product.name}
          </h1>
          <p className="mt-2 text-[22px] font-bold tracking-tight md:hidden">{formatMoney(product.priceCents)}</p>
          <p className="mt-3 text-[13.5px] leading-[1.65] text-ink-2 md:mt-6 md:text-[14px] md:leading-[1.75]">
            {product.description}
          </p>

          {product.ingredients.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 md:mt-6 md:gap-2">
              {product.ingredients.map((ing) => (
                <span
                  key={ing.id}
                  className="rounded-full border border-hair bg-paper/45 px-3 py-1.5 text-[11px] text-ink-2 md:px-3.5 md:py-2 md:text-[11.5px]"
                >
                  {ing.name}
                </span>
              ))}
            </div>
          )}

          {product.nutrition && (
            <div className="mt-3 flex flex-wrap gap-1.5 md:mt-5 md:gap-2">
              {(
                [
                  ["ккал", product.nutrition.kcal],
                  ["белки", String(product.nutrition.proteinG)],
                  ["жиры", String(product.nutrition.fatG)],
                  ["углеводы", String(product.nutrition.carbsG)],
                ] as const
              ).map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-[12px] bg-tint-plum px-3 py-2 text-[11px] text-ink-2 md:rounded-[14px] md:px-3.5 md:py-2.5"
                >
                  <b className="font-bold text-ink">{value}</b> {label}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 border-t border-hair pt-5 md:mt-8 md:pt-7">
            <ProductPurchasePanel
              productId={product.id}
              name={product.name}
              basePriceCents={product.priceCents}
              imageUrl={cover?.url ?? null}
              unavailable={unavailable}
              addons={addons.map((a) => ({
                id: a.id,
                name: a.name,
                priceCents: a.priceCents,
                colorHex: a.colorHex,
              }))}
            />
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}

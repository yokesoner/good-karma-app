import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ASSETS } from "@/lib/assets";
import { categoryThemeGradient } from "@/lib/categoryThemes";
import { ProductCard } from "@/components/ProductCard";
import { CategoryStrip } from "@/components/CategoryStrip";
import { WokBuilderCTA } from "@/components/WokBuilderCTA";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = await db.category.findUnique({ where: { id: params.id } });
  if (!category) return { title: "Категория не найдена" };
  return {
    title: category.name,
    description: `${category.name} в паназиатском кафе Гуд Карма. Доставка за 30—40 минут.`,
    alternates: { canonical: `/menu/${category.id}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const [category, categories] = await Promise.all([
    db.category.findUnique({
      where: { id: params.id },
      include: {
        meta: true,
        products: {
          where: { isHidden: false },
          orderBy: { ratingCount: "desc" },
          include: { images: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
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
  ]);

  if (!category) notFound();

  // Своя фотография из админки приоритетнее — иначе, как и раньше, берём
  // фото первого товара категории.
  const heroImageUrl = category.meta?.imageUrl ?? category.products[0]?.images[0]?.url;

  return (
    <main className="mx-auto max-w-wrap px-5 py-4 md:px-16 md:py-8">
      <CategoryStrip categories={categories} />

      {/* «Визуальный мир» категории из прототипа: фото, японская подпись
          и слоган. Фон — градиент по CategoryMeta.theme; декоративный
          узор волн поверх него — только когда pattern="seigaiha", это
          единственное значение паттерна с готовым ассетом сейчас. */}
      <section className={`relative mt-3 flex h-[132px] items-end overflow-hidden rounded-[22px] bg-gradient-to-br ${categoryThemeGradient(category.meta?.theme)} md:mt-6 md:h-[220px] md:rounded-l`}>
        {category.meta?.pattern === "seigaiha" && (
          <Image
            src={ASSETS.decor.seigaihaWave}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="pointer-events-none object-cover opacity-[0.12]"
          />
        )}
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}
        <div className="relative z-10 bg-gradient-to-r from-paper/90 to-transparent p-4 md:p-8">
          {category.meta?.jpTagline && (
            <span className="mb-1 block text-[12px] tracking-[0.3em] text-ink opacity-40 md:mb-2 md:text-[13px]">
              {category.meta.jpTagline}
            </span>
          )}
          <h1 className="text-[24px] font-bold tracking-tight md:text-[32px]">{category.name}</h1>
          {category.meta?.tagline && (
            <p className="mt-1 text-[12.5px] text-ink-2 md:mt-1.5 md:text-[13px]">{category.meta.tagline}</p>
          )}
          {category.isStopList && (
            <p className="mt-2 inline-block rounded-full bg-tint-gold px-3 py-1 text-micro font-bold uppercase tracking-[0.12em]">
              Сегодня недоступно
            </p>
          )}
        </div>
      </section>

      {category.products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[18px] font-bold">Здесь пока пусто</p>
          <Link href="/menu" className="mt-2 inline-block text-[13px] text-cherry hover:underline">
            Загляните в соседнюю категорию →
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-x-2.5 gap-y-3.5 md:mt-8 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
          {category.id === "wok" && <WokBuilderCTA />}
          {category.products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryStopped={category.isStopList}
              index={index}
            />
          ))}
        </div>
      )}
    </main>
  );
}

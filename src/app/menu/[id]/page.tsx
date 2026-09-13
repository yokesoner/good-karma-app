import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { CategoryStrip } from "@/components/CategoryStrip";
import { WokBuilderCTA } from "@/components/WokBuilderCTA";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = await db.category.findUnique({ where: { id: params.id } });
  if (!category) return { title: "Категория не найдена" };
  return {
    title: `${category.name} — Гуд Карма`,
    description: `${category.name} в паназиатском кафе Гуд Карма. Доставка за 30—40 минут.`,
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

  const heroImage = category.products[0]?.images[0];

  return (
    <main className="mx-auto max-w-wrap px-5 py-8 md:px-16">
      <CategoryStrip categories={categories} />

      {/* «Визуальный мир» категории из прототипа: фото, японская подпись
          и слоган. Оттенок берётся из CategoryMeta.accentTint. */}
      <section className="relative mt-6 flex h-[190px] items-end overflow-hidden rounded-l bg-tint-cream md:h-[220px]">
        {heroImage && (
          <Image
            src={heroImage.url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}
        <div className="relative z-10 bg-gradient-to-r from-paper/90 to-transparent p-6 md:p-8">
          {category.meta?.jpTagline && (
            <span className="mb-2 block text-[13px] tracking-[0.3em] text-ink opacity-40">
              {category.meta.jpTagline}
            </span>
          )}
          <h1 className="text-[26px] font-bold tracking-tight md:text-[32px]">{category.name}</h1>
          {category.meta?.tagline && (
            <p className="mt-1.5 text-[13px] text-ink-2">{category.meta.tagline}</p>
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
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
          {category.id === "wok" && <WokBuilderCTA />}
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ASSETS } from "@/lib/assets";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ProductCard } from "@/components/ProductCard";
import { WokBuilderCTA } from "@/components/WokBuilderCTA";
import { BackgroundFootage } from "@/components/BackgroundFootage";

export const metadata: Metadata = {
  title: "Меню — Гуд Карма",
  description:
    "Полное меню паназиатского кафе Гуд Карма: роллы, рамен, вок, пицца, супы, закуски, напитки и десерты.",
};

export default async function MenuPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      meta: true,
      products: {
        where: { isHidden: false },
        orderBy: { ratingCount: "desc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const total = categories.reduce((n, c) => n + c.products.length, 0);

  return (
    <main className="menu-canvas mx-auto max-w-wrap px-5 py-8 md:px-16 md:py-12">
      <section className="group relative isolate mb-6 min-h-[560px] overflow-hidden rounded-[38px] border border-white/75 bg-[#F9F5ED] px-7 py-10 text-[#392A34] shadow-[0_30px_100px_-52px_rgba(73,48,68,.55)] md:min-h-[600px] md:px-12 md:py-12">
        <Image
          src={ASSETS.backgrounds.menuEditorial}
          alt="Рамен, суши и керамический кот — настроение меню Гуд Карма"
          fill
          priority
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover object-[68%_center] transition-transform duration-[1800ms] ease-out group-hover:scale-[1.018]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FBF8F2] via-[#FBF8F2]/96 via-[49%] to-[#FBF8F2]/5" />
        <BackgroundFootage src={ASSETS.animations.steam} opacity={0.12} priority />
        <div className="relative flex min-h-[480px] max-w-[610px] flex-col justify-center md:min-h-[504px]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9A536E]">
              Меню · {total} блюд · два мира
            </span>
            <h1 className="mt-5 max-w-[9ch] text-[44px] font-bold leading-[0.96] tracking-[-0.055em] md:text-[68px]">
              Вкус, который остаётся
            </h1>
            <p className="mt-6 max-w-[46ch] text-[13.5px] leading-[1.8] text-[#756670]">
              От спокойной точности роллов до живого огня вока и европейского тепла печи.
              Выбирайте настроение — остальное соберём на открытой кухне.
            </p>
          </div>

          <div className="mt-8 max-w-[520px] rounded-[26px] border border-white/80 bg-white/52 p-5 shadow-[0_20px_46px_-30px_rgba(73,48,68,.5)] backdrop-blur-xl md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#9A536E]">
                  Noodle Lab
                </span>
                <h2 className="mt-1 text-[18px] font-bold">Соберите свой вок</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[#493044]/10 bg-white/60 text-[#9A536E] shadow-s">
                03
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Основа", "Белок", "Соус"].map((step, index) => (
                <span
                  key={step}
                  className="rounded-full border border-[#493044]/10 bg-[#FBF8F2]/55 px-2 py-2 text-center text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#76636F]"
                >
                  {index + 1}. {step}
                </span>
              ))}
            </div>
            <Link
              href="/wok-builder"
              className="mt-5 flex items-center justify-between rounded-full bg-[#3A2338] px-5 py-3.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#FFF8F2] shadow-[0_14px_30px_-18px_rgba(58,35,56,.7)] transition hover:-translate-y-0.5 hover:bg-[#513347]"
            >
              Открыть конструктор <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/70 bg-paper-2/72 p-4 shadow-[0_18px_60px_-42px_rgba(73,48,68,.5)] backdrop-blur-xl md:p-6">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-cherry">Быстрый выбор</span>
            <h2 className="mt-1 text-[20px] font-bold tracking-tight">Куда сегодня?</h2>
          </div>
          <span className="hidden text-[11px] text-ink-3 sm:block">Листайте категории →</span>
        </div>
        <CategoryStrip categories={categories} />
      </section>

      {categories.map((category, categoryIndex) =>
        category.products.length === 0 ? null : (
          <section
            key={category.id}
            id={category.id}
            className={`menu-category menu-category-${categoryIndex % 3} mt-16 scroll-mt-24 rounded-[34px] px-1 py-2 md:px-3`}
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-hair pb-5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3">
                  {String(categoryIndex + 1).padStart(2, "0")} · Категория
                </span>
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-[28px] font-bold tracking-[-0.03em] md:text-[34px]">
                    {category.name}
                  </h2>
                  {category.meta?.jpTagline && (
                    <span className="text-[12px] tracking-[0.3em] text-cherry/70">
                      {category.meta.jpTagline}
                    </span>
                  )}
                </div>
              </div>
              {category.meta?.tagline && (
                <span className="max-w-[30ch] text-right text-[12px] leading-relaxed text-ink-3">
                  {category.meta.tagline}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
              {category.id === "wok" && <WokBuilderCTA />}
              {category.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ),
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ASSETS } from "@/lib/assets";
import { CategoryStrip } from "@/components/CategoryStrip";
import { MenuCategoryNav } from "@/components/MenuCategoryNav";
import { ProductCard } from "@/components/ProductCard";
import { WokBuilderCTA } from "@/components/WokBuilderCTA";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { getBanner } from "@/server/siteBanners";

export const metadata: Metadata = {
  title: "Меню",
  description:
    "Полное меню паназиатского кафе Гуд Карма: роллы, рамен, вок, пицца, супы, закуски, напитки и десерты.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [categories, hero, wokCard] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        meta: true,
        products: {
          where: { isHidden: false },
          orderBy: { ratingCount: "desc" },
          include: { images: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
    getBanner("menu-hero"),
    getBanner("menu-wok"),
  ]);

  const total = categories.reduce((n, c) => n + c.products.length, 0);
  const eyebrow = hero.eyebrow.replace("{count}", String(total));
  const visibleCategories = categories.filter((c) => c.products.length > 0);

  return (
    <main className="menu-canvas mx-auto max-w-wrap px-5 pb-8 pt-4 md:px-16 md:py-12">
      {/* Телефон: компактная шапка вместо экрана с фотографией — блюда
          начинаются сразу. Планшет и десктоп: прежний большой блок ниже. */}
      <header className="md:hidden">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">{eyebrow}</span>
        <h1 className="mt-1 text-[26px] font-extrabold leading-[1.05] tracking-[-0.035em]">{hero.title}</h1>
      </header>

      <Link
        href={wokCard.href}
        className="anim-pop mt-3 flex items-center gap-3 rounded-[20px] border border-plum/15 bg-gradient-to-br from-tint-peach via-tint-gold to-tint-sakura p-3.5 shadow-s transition duration-200 active:scale-[0.985] md:hidden"
      >
        <span aria-hidden className="text-[26px] leading-none">🥢</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[8.5px] font-bold uppercase tracking-[0.18em] text-cherry">{wokCard.eyebrow}</span>
          <span className="mt-0.5 block text-[15px] font-bold leading-tight">{wokCard.title}</span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-btn text-btn-fg">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>

      <MenuCategoryNav
        items={visibleCategories.map((c) => ({ id: c.id, name: c.name, stopped: c.isStopList }))}
      />

      <section className="group relative isolate mb-6 hidden min-h-[600px] overflow-hidden rounded-[38px] border border-white/75 bg-[#F9F5ED] px-12 py-12 text-[#392A34] shadow-[0_30px_100px_-52px_rgba(73,48,68,.55)] md:block">
        <Image
          src={hero.imageUrl ?? ASSETS.backgrounds.menuEditorial}
          alt="Рамен, суши и керамический кот — настроение меню Гуд Карма"
          fill
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover object-[68%_center] transition-transform duration-[1800ms] ease-out group-hover:scale-[1.018]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FBF8F2] via-[#FBF8F2]/95 via-[49%] to-[#FBF8F2]/5" />
        <BackgroundFootage src={ASSETS.animations.steam} opacity={0.12} />
        <div className="relative flex min-h-[504px] max-w-[610px] flex-col justify-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9A536E]">{eyebrow}</span>
            <h1 className="mt-5 max-w-[9ch] text-[68px] font-bold leading-[0.96] tracking-[-0.055em]">{hero.title}</h1>
            <p className="mt-6 max-w-[46ch] text-[13.5px] leading-[1.8] text-[#756670]">{hero.text}</p>
          </div>

          <div className="mt-8 max-w-[520px] rounded-[26px] border border-white/80 bg-white/50 p-6 shadow-[0_20px_46px_-30px_rgba(73,48,68,.5)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#9A536E]">
                  {wokCard.eyebrow}
                </span>
                <h2 className="mt-1 text-[18px] font-bold">{wokCard.title}</h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-[#493044]/10 bg-white/60 text-[#9A536E] shadow-s">
                03
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Основа", "Начинка", "Соус"].map((step, index) => (
                <span
                  key={step}
                  className="rounded-full border border-[#493044]/10 bg-[#FBF8F2]/55 px-2 py-2 text-center text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#76636F]"
                >
                  {index + 1}. {step}
                </span>
              ))}
            </div>
            <Link
              href={wokCard.href}
              className="mt-5 flex items-center justify-between rounded-full bg-[#3A2338] px-5 py-3.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#FFF8F2] shadow-[0_14px_30px_-18px_rgba(58,35,56,.7)] transition hover:-translate-y-0.5 hover:bg-[#513347]"
            >
              {wokCard.buttonLabel} <ArrowUpRight className="text-[14px]" />
            </Link>
          </div>
        </div>
      </section>

      <section className="hidden rounded-[30px] border border-white/70 bg-paper-2/70 p-6 shadow-[0_18px_60px_-42px_rgba(73,48,68,.5)] backdrop-blur-xl md:block">
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
            className={`menu-category menu-category-${categoryIndex % 3} mt-7 scroll-mt-[8.5rem] rounded-[34px] px-0 py-2 md:mt-16 md:scroll-mt-24 md:px-3`}
          >
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-hair pb-3 md:mb-6 md:pb-5">
              <div>
                <span className="hidden text-[9px] font-bold uppercase tracking-[0.18em] text-ink-3 md:block">
                  {String(categoryIndex + 1).padStart(2, "0")} · Категория
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 md:mt-1">
                  <h2 className="text-[21px] font-bold tracking-[-0.03em] md:text-[34px]">
                    {category.name}
                  </h2>
                  {category.meta?.jpTagline && (
                    <span className="text-[11px] tracking-[0.3em] text-cherry/70 md:text-[12px]">
                      {category.meta.jpTagline}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-ink-3 md:hidden">
                    {category.products.length}
                  </span>
                </div>
              </div>
              {category.isStopList ? (
                <span className="rounded-full bg-tint-gold px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em]">
                  Сегодня недоступно
                </span>
              ) : (
                category.meta?.tagline && (
                  <span className="hidden max-w-[30ch] text-right text-[12px] leading-relaxed text-ink-3 md:block">
                    {category.meta.tagline}
                  </span>
                )
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 md:grid-cols-4 md:gap-x-8 md:gap-y-9">
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
          </section>
        ),
      )}
    </main>
  );
}

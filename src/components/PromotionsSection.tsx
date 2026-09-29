import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ASSETS } from "@/lib/assets";
import { ArrowRight, ChevronDown } from "@/components/icons";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { GoldHairline } from "@/components/GoldHairline";
import { PromoTicket } from "@/components/PromoTicket";
import { getStorefrontPromotions } from "@/server/storefrontPromotions";

// Страница /promotions: редакционная шапка (правится в админке) и все
// действующие или скоро начинающиеся акции талонами. Раньше здесь была
// сетка ровно под «флагман + вторая + инфокарточка»: третья акция из
// админки просто не показывалась, а подпись «Счастливые часы / Первый
// заказ» выбиралась по самому промокоду.
export async function PromotionsSection() {
  const [promos, heroBanner] = await Promise.all([
    getStorefrontPromotions(),
    db.promoHeroBanner.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <section id="promotions" className="mx-auto max-w-wrap px-4 py-5 sm:px-5 sm:py-8 md:px-16 md:py-12">
      <article className="promo-hero group relative isolate grid overflow-hidden rounded-[22px] border border-gold/20 bg-paper-2 shadow-l sm:rounded-[32px] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:p-12">
          <div className="mb-3 flex items-center gap-3 sm:mb-5">
            <GoldHairline width={36} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cherry">
              Акции · Good Karma Club
            </span>
          </div>
          <h1 className="max-w-[13ch] text-[28px] font-bold leading-[1.04] tracking-[-0.035em] text-ink sm:max-w-[12ch] sm:text-[40px] sm:tracking-[-0.045em] md:text-[50px]">
            {heroBanner?.title ?? "Всё хорошее возвращается"}
          </h1>
          <p className="mt-3 max-w-[40ch] text-[13.5px] leading-[1.65] text-ink-2 sm:mt-5 sm:text-[14px] sm:leading-[1.75]">
            {heroBanner?.description ??
              "Особенные предложения, любимые блюда и подарки за вашу карму. Маленькие поводы радовать себя чаще."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            {promos.length > 0 && (
              <a
                href="#offers"
                className="btn-sheen inline-flex min-h-11 items-center rounded-full bg-btn px-5 text-[11px] font-bold text-btn-fg shadow-m transition duration-300 active:scale-95 sm:min-h-12 sm:px-6 hover:shadow-l motion-safe:hover:-translate-y-0.5"
              >
                Забрать выгоду
              </a>
            )}
            <a
              href="#karma-club"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gold/30 bg-paper px-5 text-[11px] font-bold text-ink transition duration-300 active:scale-95 sm:min-h-12 sm:px-6 hover:border-gold/60"
            >
              О клубе <ChevronDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="relative min-h-[170px] overflow-hidden sm:min-h-[280px] lg:min-h-[420px]">
          <Image
            src={heroBanner?.imageUrl ?? ASSETS.backgrounds.karmaGarden}
            alt="Кот, лиса и кролик в саду Good Karma"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[65%_center] transition-transform duration-[1800ms] motion-safe:group-hover:scale-[1.025]"
          />
          <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.16} />
          <span className="absolute bottom-3 right-3 rounded-full border border-gold/30 bg-[#FBF8F2]/90 px-3 py-1.5 text-caption font-semibold tracking-wide text-[#493044] backdrop-blur-md sm:bottom-5 sm:right-5 sm:px-4 sm:py-2">
            Вкусно быть вместе · 良いカルマ
          </span>
        </div>
      </article>

      <div id="offers" className="scroll-mt-24 pt-9 sm:pt-12 md:pt-16">
        <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cherry">Сегодня для вас</span>
            <h2 className="mt-2 text-[28px] font-bold leading-[1.04] tracking-[-0.035em] sm:mt-3 sm:text-[40px] sm:tracking-[-0.04em] md:text-[48px]">
              Выгода со вкусом
            </h2>
          </div>
          <p className="max-w-[40ch] text-[13px] leading-relaxed text-ink-2">
            Нажмите «Применить» — код скопируется и сразу встанет в корзину. Одна скидка на заказ.
          </p>
        </div>

        {promos.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2 xl:gap-6">
            {promos.map((promo, index) => (
              <PromoTicket key={promo.code} promo={promo} index={index} />
            ))}
          </div>
        ) : (
          // Пустое состояние — не повод прятать раздел: у клуба подарки есть всегда.
          <div className="rounded-[26px] border border-dashed border-gold/40 bg-paper-2/60 px-6 py-10 text-center sm:px-10">
            <p className="text-[18px] font-bold tracking-tight">Сейчас акций нет — скоро появятся новые</p>
            <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] leading-relaxed text-ink-2">
              А баллы Karma Club копятся с каждого заказа и превращаются в подарки.
            </p>
            <a href="#karma-club" className="mt-5 inline-flex min-h-11 items-center gap-2 text-[12px] font-bold text-cherry">
              Посмотреть подарки клуба <ChevronDown className="text-[14px]" />
            </a>
          </div>
        )}

        {promos.length > 0 && (
          <Link
            href="#karma-club"
            data-reveal="fade"
            className="group mt-6 flex items-center justify-between gap-4 rounded-[22px] border border-mint-deep/25 bg-tint-mint/70 px-5 py-4 text-[13.5px] leading-snug text-ink transition hover:border-mint-deep/50 sm:px-6"
          >
            <span>
              <b className="font-semibold">Карма начисляется даже со скидкой.</b>{" "}
              <span className="text-ink-2">Баллы за заказ приходят как обычно — и ведут к подаркам клуба.</span>
            </span>
            <ArrowRight className="shrink-0 text-[16px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </section>
  );
}

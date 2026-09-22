import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDiscount, formatMoney } from "@/lib/money";
import { ASSETS } from "@/lib/assets";
import { ChevronDown } from "@/components/icons";
import { PromoCodeButton } from "@/components/PromoCodeButton";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { GoldHairline } from "@/components/GoldHairline";
import { promoBackgroundGradient } from "@/lib/promoBackgrounds";
import { isPromotionCurrentlyActive } from "@/lib/promoSchedule";
import { cn } from "@/lib/cn";

export async function PromotionsSection({ compact = false }: { compact?: boolean }) {
  const [allPromotions, heroBanner] = await Promise.all([
    db.promotion.findMany({
      where: { isActive: true },
      orderBy: { discountPct: "desc" },
    }),
    db.promoHeroBanner.findUnique({ where: { id: "singleton" } }),
  ]);
  // isActive в БД — только "включена админом", не "действует прямо
  // сейчас": акция с истёкшим activeTo или вне окна повтора (DAILY/WEEKLY/
  // MONTHLY) продолжает быть isActive: true, но здесь ей не место — иначе
  // баннер продолжал бы висеть неприменимым обещанием (см. src/lib/promoSchedule.ts).
  const promotions = allPromotions.filter((promo) => isPromotionCurrentlyActive(promo));
  const flagship = promotions[0];
  if (!flagship) return null;

  const imageIds = promotions
    .map((promotion) => promotion.featuredImageProductId)
    .filter((id): id is string => Boolean(id));
  const images = imageIds.length
    ? await db.productImage.findMany({
        where: { productId: { in: imageIds } },
        orderBy: { sortOrder: "asc" },
      })
    : [];
  const imageByProductId = new Map(
    images.map((image) => [image.productId, { url: image.url, alt: image.alt }]),
  );
  const second = promotions[1];
  const flagshipImage = flagship.imageUrl
    ? { url: flagship.imageUrl, alt: flagship.title }
    : flagship.featuredImageProductId
      ? imageByProductId.get(flagship.featuredImageProductId)
      : undefined;
  const secondBackground = promoBackgroundGradient(second?.backgroundKey ?? null);

  return (
    <section
      id="promotions"
      className={cn(
        "mx-auto max-w-wrap",
        compact ? "px-0 py-7 sm:py-12" : "px-4 py-5 sm:px-5 sm:py-8 md:px-16 md:py-12",
      )}
    >
      {/* Раньше вся секция была вёрстана только под десктоп (шрифты вплоть
          до 112px, отступы p-7/p-10/p-12) — на телефоне это читалось как
          несоразмерно растянутая лента огромных цифр. Ниже у каждого блока
          свой мобильный размер, а sm/md-варианты — прежние, без изменений. */}
      {!compact && <article className="promo-hero group relative isolate grid overflow-hidden rounded-[22px] border border-gold/20 bg-paper-2 shadow-l sm:rounded-[32px] lg:grid-cols-[1.05fr_1fr]">
        <div className="relative flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:p-12">
          <div className="mb-3 flex items-center gap-3 sm:mb-5">
            <GoldHairline width={36} />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-cherry sm:text-[10px] sm:tracking-[0.18em]">
              Акции · Good Karma Club
            </span>
          </div>
          <h1 className="max-w-[13ch] text-[26px] font-bold leading-[1.06] tracking-[-0.035em] text-ink sm:text-[36px] sm:leading-[1.02] sm:tracking-[-0.045em] sm:max-w-[12ch] md:text-[50px]">
            {heroBanner?.title ?? "Всё хорошее возвращается"}
          </h1>
          <p className="mt-3 max-w-[40ch] text-[12.5px] leading-[1.6] text-ink-2 sm:mt-5 sm:text-[14px] sm:leading-[1.75]">
            {heroBanner?.description ?? "Особенные предложения, любимые блюда и подарки за вашу карму. Маленькие поводы радовать себя чаще."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            <a
              href="#offers"
              className="btn-sheen inline-flex min-h-10 items-center rounded-full bg-btn px-5 text-[10px] font-bold text-btn-fg shadow-m transition duration-300 active:scale-95 sm:min-h-12 sm:px-6 sm:py-3 sm:text-[11px] hover:shadow-l motion-safe:hover:-translate-y-0.5"
            >
              Забрать выгоду
            </a>
            <a
              href="#karma-club"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-gold/30 bg-paper px-5 text-[10px] font-bold text-ink transition duration-300 active:scale-95 sm:min-h-12 sm:px-6 sm:py-3 sm:text-[11px] hover:border-gold/60"
            >
              О клубе <ChevronDown className="h-3.5 w-3.5" />
            </a>
          </div>

        </div>
        <div className="relative min-h-[160px] overflow-hidden sm:min-h-[280px] lg:min-h-[420px]">
          <Image src={heroBanner?.imageUrl ?? ASSETS.backgrounds.karmaGarden} alt="Кот, лиса и кролик в саду Good Karma" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[65%_center] transition-transform duration-[1800ms] motion-safe:group-hover:scale-[1.025]" />
          <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.16} />
          <span className="absolute bottom-3 right-3 rounded-full border border-gold/30 bg-[#FBF8F2]/90 px-3 py-1.5 text-[9px] font-semibold tracking-wide text-[#493044] backdrop-blur-md sm:bottom-5 sm:right-5 sm:px-4 sm:py-2 sm:text-[10px]">Вкусно быть вместе · 良いカルマ</span>
        </div>
      </article>}

      <div id="offers" className={cn("scroll-mt-24", !compact && "pt-6 sm:pt-10 md:pt-12")}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cherry sm:text-[10px] sm:tracking-[0.24em]">
              Сегодня для вас
            </span>
            <h2 className="mt-2 max-w-[15ch] text-[24px] font-bold leading-[1.06] tracking-[-0.035em] sm:mt-3 sm:text-[34px] sm:leading-[1.02] sm:tracking-[-0.04em] md:text-[50px]">
              Выгода со вкусом
            </h2>
          </div>
          <p className="hidden max-w-[38ch] text-[13px] leading-relaxed text-ink-2 sm:block">
            Промокод можно скопировать одним касанием — он сохранится в корзине и
            применится при оформлении заказа.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <article className="group relative min-h-[260px] overflow-hidden rounded-[24px] border border-hair bg-paper-2 shadow-s transition duration-500 sm:min-h-[380px] sm:rounded-[34px] motion-safe:hover:-translate-y-1 hover:shadow-l">
            {flagshipImage ? (
              <Image
                src={flagshipImage.url}
                alt={flagshipImage.alt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover transition-transform duration-[1100ms] motion-safe:group-hover:scale-[1.04]"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2F202D]/95 via-[#3C2737]/80 to-[#3C2737]/10" />
            <div className="relative flex h-full min-h-[260px] max-w-[500px] flex-col justify-between gap-4 p-5 text-[#FFF8F2] sm:min-h-[380px] sm:gap-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[8.5px] font-bold uppercase tracking-[0.16em] backdrop-blur-md sm:px-4 sm:py-2 sm:text-[9px] sm:tracking-[0.2em]">
                  {flagship.code === "HAPPY20" ? "Счастливые часы" : "Первый заказ"}
                </span>
                <span className="text-[10px] text-white/80 sm:text-[11px]">от {formatMoney(flagship.minOrderCents)}</span>
              </div>
              <div>
                <div className="text-[52px] font-bold leading-none tracking-[-0.05em] sm:text-[82px] md:text-[112px]">
                  {formatDiscount(flagship.type, flagship.discountPct, flagship.discountFixedCents)}
                </div>
                <p className="mt-3 line-clamp-2 max-w-[30ch] text-[12.5px] leading-relaxed text-white/70 sm:mt-4 sm:line-clamp-none sm:text-[14px]">
                  {flagship.description}
                </p>
                <div className="mt-5 sm:mt-7">
                  <PromoCodeButton code={flagship.code} />
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {second ? (
              <article className={`relative isolate overflow-hidden rounded-[22px] border border-white/70 bg-gradient-to-br p-5 shadow-s transition duration-500 sm:rounded-[30px] sm:p-7 motion-safe:hover:-translate-y-1 hover:shadow-m ${secondBackground}`}>
                <div aria-hidden className="promo-rings absolute -right-12 -top-12 h-44 w-44 opacity-45" />
                <div className="relative">
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#93566E] sm:text-[9px] sm:tracking-[0.22em]">
                    {second.code === "KARMA15" ? "Первое знакомство" : "Специально для вас"}
                  </span>
                  <div className="mt-3 text-[36px] font-bold leading-none tracking-[-0.045em] text-[#493044] sm:mt-4 sm:text-[54px] sm:tracking-[-0.06em]">
                    {formatDiscount(second.type, second.discountPct, second.discountFixedCents)}
                  </div>
                  <p className="mt-2 line-clamp-2 max-w-[28ch] text-[12px] leading-relaxed text-[#74636E] sm:mt-3 sm:line-clamp-none sm:text-[13px]">
                    {second.description}
                  </p>
                  <div className="mt-4 sm:mt-6">
                    <PromoCodeButton code={second.code} variant="ghost" />
                  </div>
                </div>
              </article>
            ) : null}

            <article className="relative overflow-hidden rounded-[22px] border border-white/70 bg-gradient-to-br from-[#EDF3EF] to-[#F7F1E8] p-5 shadow-s transition duration-500 sm:rounded-[30px] sm:p-7 motion-safe:hover:-translate-y-1 hover:shadow-m">
              <div className="relative flex h-full flex-col justify-between gap-4">
                <div>
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#638274] sm:text-[9px] sm:tracking-[0.22em]">
                    Всегда с заказом
                  </span>
                  <h3 className="mt-3 max-w-[16ch] text-[19px] font-bold leading-[1.12] tracking-[-0.025em] text-[#344A40] sm:mt-4 sm:max-w-[13ch] sm:text-[25px] sm:leading-[1.08] sm:tracking-[-0.03em]">
                    Карма начисляется даже со скидкой
                  </h3>
                </div>
                <a
                  href={compact ? "/promotions#karma-club" : "#karma-club"}
                  className="inline-flex min-h-10 items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.11em] text-[#506F61] sm:min-h-11 sm:text-[10px] sm:tracking-[0.13em]"
                >
                  Как это работает <ChevronDown className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>

      {compact ? (
        <div className="mt-6 text-center sm:mt-8">
          <Link
            href="/promotions"
            className="inline-flex rounded-full border border-hair bg-paper-2 px-6 py-3 text-[9.5px] font-bold uppercase tracking-[0.12em] shadow-s transition duration-300 active:scale-95 sm:px-7 sm:py-3.5 sm:text-[10px] sm:tracking-[0.14em] motion-safe:hover:-translate-y-0.5 hover:shadow-m"
          >
            Все акции и Karma Club →
          </Link>
        </div>
      ) : null}
    </section>
  );
}

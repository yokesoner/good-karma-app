import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ASSETS } from "@/lib/assets";
import { PromoCodeButton } from "@/components/PromoCodeButton";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { GoldHairline } from "@/components/GoldHairline";
import { cn } from "@/lib/cn";

export async function PromotionsSection({ compact = false }: { compact?: boolean }) {
  const promotions = await db.promotion.findMany({
    where: { isActive: true },
    orderBy: { discountPct: "desc" },
  });
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
  const flagshipImage = flagship.featuredImageProductId
    ? imageByProductId.get(flagship.featuredImageProductId)
    : undefined;

  return (
    <section
      id="promotions"
      className={cn(
        "mx-auto max-w-wrap",
        compact ? "px-0 py-12" : "px-5 py-8 md:px-16 md:py-12",
      )}
    >
      {!compact && <article className="promo-hero group relative isolate grid overflow-hidden rounded-[32px] border border-gold/20 bg-paper-2 shadow-l lg:grid-cols-[1.05fr_1fr]">
        <div className="relative flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:p-12">
          <div className="mb-5 flex items-center gap-3">
            <GoldHairline width={36} />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cherry">
              Акции · Good Karma Club
            </span>
          </div>
          <h1 className="max-w-[12ch] text-[36px] font-bold leading-[1.02] tracking-[-0.045em] text-ink sm:text-[50px]">
            Всё хорошее возвращается
          </h1>
          <p className="mt-5 max-w-[40ch] text-[14px] leading-[1.75] text-ink-2">
            Особенные предложения, любимые блюда и подарки за вашу карму. Маленькие поводы радовать себя чаще.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#offers"
              className="inline-flex min-h-12 items-center rounded-full bg-btn px-6 py-3 text-[11px] font-bold text-btn-fg shadow-m transition duration-300 active:scale-95 hover:shadow-l motion-safe:hover:-translate-y-0.5"
            >
              Забрать выгоду
            </a>
            <a
              href="#karma-club"
              className="inline-flex min-h-12 items-center rounded-full border border-gold/30 bg-paper px-6 py-3 text-[11px] font-bold text-ink transition duration-300 active:scale-95 hover:border-gold/60"
            >
              О клубе ↓
            </a>
          </div>

        </div>
        <div className="relative min-h-[210px] overflow-hidden sm:min-h-[280px] lg:min-h-[420px]">
          <Image src={ASSETS.backgrounds.karmaGarden} alt="Кот, лиса и кролик в саду Good Karma" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[65%_center] transition-transform duration-[1800ms] motion-safe:group-hover:scale-[1.025]" />
          <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.16} />
          <span className="absolute bottom-5 right-5 rounded-full border border-gold/30 bg-[#FBF8F2]/90 px-4 py-2 text-[10px] font-semibold tracking-wide text-[#493044] backdrop-blur-md">Вкусно быть вместе · 良いカルマ</span>
        </div>
      </article>}

      <div id="offers" className={cn("scroll-mt-24", !compact && "pt-10 md:pt-12")}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cherry">
              Сегодня для вас
            </span>
            <h2 className="mt-3 max-w-[15ch] text-[34px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[50px]">
              Выгода со вкусом
            </h2>
          </div>
          <p className="max-w-[38ch] text-[13px] leading-relaxed text-ink-2">
            Промокод можно скопировать одним касанием — он сохранится в корзине и
            применится при оформлении заказа.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.75fr]">
          <article className="group relative min-h-[380px] overflow-hidden rounded-[34px] border border-hair bg-paper-2 shadow-s transition duration-500 motion-safe:hover:-translate-y-1 hover:shadow-l">
            {flagshipImage ? (
              <Image
                src={flagshipImage.url}
                alt={flagshipImage.alt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover transition-transform duration-[1100ms] motion-safe:group-hover:scale-[1.04]"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2F202D]/95 via-[#3C2737]/79 to-[#3C2737]/10" />
            <div className="relative flex h-full min-h-[380px] max-w-[500px] flex-col justify-between gap-8 p-6 text-[#FFF8F2] md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
                  {flagship.code === "HAPPY20" ? "Счастливые часы" : "Первый заказ"}
                </span>
                <span className="text-[11px] text-white/80">от {formatMoney(flagship.minOrderCents)}</span>
              </div>
              <div>
                <div className="text-[82px] font-bold leading-none tracking-[-0.065em] md:text-[112px]">
                  −{flagship.discountPct}%
                </div>
                <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-white/72">
                  {flagship.description}
                </p>
                <div className="mt-7">
                  <PromoCodeButton code={flagship.code} />
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {second ? (
              <article className="relative isolate overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#F8E8E7] via-[#F4E7ED] to-[#E8E2F0] p-7 shadow-s transition duration-500 motion-safe:hover:-translate-y-1 hover:shadow-m">
                <div aria-hidden className="promo-rings absolute -right-12 -top-12 h-44 w-44 opacity-45" />
                <div className="relative">
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#93566E]">
                    {second.code === "KARMA15" ? "Первое знакомство" : "Специально для вас"}
                  </span>
                  <div className="mt-4 text-[54px] font-bold leading-none tracking-[-0.06em] text-[#493044]">
                    −{second.discountPct}%
                  </div>
                  <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-[#74636E]">
                    {second.description}
                  </p>
                  <div className="mt-6">
                    <PromoCodeButton code={second.code} variant="ghost" />
                  </div>
                </div>
              </article>
            ) : null}

            <article className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#EDF3EF] to-[#F7F1E8] p-7 shadow-s transition duration-500 motion-safe:hover:-translate-y-1 hover:shadow-m">
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#638274]">
                    Всегда с заказом
                  </span>
                  <h3 className="mt-4 max-w-[13ch] text-[25px] font-bold leading-[1.08] tracking-[-0.03em] text-[#344A40]">
                    Карма начисляется даже со скидкой
                  </h3>
                </div>
                <a
                  href={compact ? "/promotions#karma-club" : "#karma-club"}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#506F61]"
                >
                  Как это работает <span aria-hidden>↓</span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>

      {compact ? (
        <div className="mt-8 text-center">
          <Link
            href="/promotions"
            className="inline-flex rounded-full border border-hair bg-paper-2 px-7 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-s transition duration-300 active:scale-95 motion-safe:hover:-translate-y-0.5 hover:shadow-m"
          >
            Все акции и Karma Club →
          </Link>
        </div>
      ) : null}
    </section>
  );
}

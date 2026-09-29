import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { GoldHairline } from "@/components/GoldHairline";
import { PromoCarousel } from "@/components/PromoCarousel";
import { getStorefrontPromotions } from "@/server/storefrontPromotions";

// Блок акций на главной: карусель из тех акций, у которых в админке стоит
// «Показывать в карусели». Нет ни одной подходящей — блока нет совсем,
// пустая рамка с заголовком «Акции» выглядела бы как поломка.
export async function HomePromotions() {
  const promos = await getStorefrontPromotions({ homeOnly: true });
  if (promos.length === 0) return null;

  return (
    <section aria-labelledby="home-promos-title" className="mx-auto max-w-wrap px-4 py-10 sm:px-5 md:px-16 md:py-16">
      <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-8">
        <div>
          <p className="flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-cherry">
            <GoldHairline width={28} />
            Сегодня для вас
          </p>
          <h2 id="home-promos-title" className="mt-3 text-[30px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[46px]">
            Акции и предложения
          </h2>
        </div>
        <Link
          href="/promotions"
          className="group inline-flex min-h-11 items-center gap-2 text-[12px] font-bold text-ink transition hover:text-cherry"
        >
          Все акции и Karma Club
          <ArrowRight className="text-[15px] transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
      <div data-reveal="fade">
        <PromoCarousel promos={promos} />
      </div>
    </section>
  );
}

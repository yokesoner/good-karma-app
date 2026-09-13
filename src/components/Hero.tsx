import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { CulturalAccent } from "@/components/CulturalAccent";

// Первый экран не зависит от каталога: даже при обслуживании базы бренд,
// навигация и основное предложение остаются видимыми. Конкретные блюда и
// цены по-прежнему берутся только из БД в секции меню.
export function Hero() {
  return (
    <section className="site-hero mx-auto max-w-wrap px-3 pb-5 pt-3 sm:px-5 md:px-8 md:pb-8 md:pt-6">
      <div className="relative isolate min-h-[600px] overflow-hidden rounded-[30px] border border-hair bg-tint-ivory shadow-l sm:min-h-[640px] md:min-h-[680px] md:rounded-[38px]">
        <Image
          src={ASSETS.backgrounds.heroTwoWorlds}
          alt="Рамен, роллы и выпечка Good Karma на сервированном столе"
          fill
          priority
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover object-[64%_center] md:object-center"
        />

        {/* Плотность градиента выше на мобильном: текст остаётся читаемым
            при узком кадрировании, а на desktop фотография раскрывается. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--t-ivory))_0%,rgb(var(--t-ivory)/.98)_34%,rgb(var(--t-ivory)/.78)_53%,rgb(var(--t-ivory)/.08)_78%)] md:bg-[linear-gradient(90deg,rgb(var(--t-ivory))_0%,rgb(var(--t-ivory)/.97)_30%,rgb(var(--t-ivory)/.58)_48%,transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-plum-deep/25 via-transparent to-white/10"
        />
        <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.2} priority />
        <CulturalAccent
          world="japan"
          priority
          className="right-[2.5%] top-[15%] z-10 hidden h-[250px] w-[166px] opacity-70 lg:block"
        />

        <div className="relative z-10 flex min-h-[600px] flex-col p-6 sm:min-h-[640px] sm:p-10 md:min-h-[680px] md:p-14 lg:p-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-cherry/70" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-2 md:text-[11px]">
              Good Karma · Pan Asian Café
            </span>
          </div>

          <div className="my-auto max-w-[610px] py-8 sm:py-12">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cherry">
              Одно кафе · два мира
            </p>
            <h1 className="max-w-[10ch] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink sm:text-[54px] md:text-[68px] lg:text-[78px]">
              Азия встречает Европу
            </h1>
            <p className="mt-6 max-w-[43ch] text-[14px] font-medium leading-[1.75] text-ink-2 md:text-[15px]">
              Роллы, рамен и вок соседствуют с тонким тестом и тёплой выпечкой.
              Всё готовим на открытой кухне — внимательно, честно и с хорошей кармой.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-plum-deep px-8 text-[11px] font-bold uppercase tracking-[0.1em] text-[#F7EFF4] shadow-s transition duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-m"
              >
                Выбрать блюдо
              </Link>
              <Link
                href="/wok-builder"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-plum/35 bg-paper/45 px-7 text-[11px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur-md transition duration-300 motion-safe:hover:-translate-y-0.5 hover:border-plum hover:bg-paper/70"
              >
                Собрать свой вок
              </Link>
            </div>
          </div>

          <div className="grid max-w-[720px] grid-cols-1 gap-2.5 border-t border-ink/15 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2 sm:grid-cols-3 sm:gap-6">
            <span>Открытая кухня</span>
            <span>Карма-баллы за заказ</span>
            <span>Доставка до 20 км</span>
          </div>
        </div>

        <div className="absolute right-6 top-7 z-10 hidden items-center gap-3 text-[#F8F0EA]/75 md:flex">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]">良いカルマ</span>
          <span className="h-8 w-px bg-white/35" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Since 2018</span>
        </div>

        <div className="absolute bottom-7 right-7 z-10 hidden gap-2 lg:flex">
          <Link
            href="/menu/rolls"
            className="rounded-full border border-white/30 bg-plum-deep/55 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F8F0EA] backdrop-blur-md transition hover:bg-plum-deep/75"
          >
            Япония · ロール
          </Link>
          <Link
            href="/menu/pizza"
            className="rounded-full border border-white/30 bg-plum-deep/55 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F8F0EA] backdrop-blur-md transition hover:bg-plum-deep/75"
          >
            Европа · Pizza
          </Link>
        </div>
      </div>
    </section>
  );
}

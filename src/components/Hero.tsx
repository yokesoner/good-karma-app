import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/lib/assets";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { CulturalAccent } from "@/components/CulturalAccent";
import { getBanner } from "@/server/siteBanners";

// Первый экран не зависит от каталога: даже при обслуживании базы бренд,
// навигация и основное предложение остаются видимыми. Конкретные блюда и
// цены по-прежнему берутся только из БД в секции меню. Тексты и картинка —
// редактируемый баннер «Главный экран» (/admin/banners); если базы нет,
// getBanner отдаёт исходные тексты, а не роняет страницу.
//
// Мобильный и desktop-макет — полностью раздельная разметка (не просто
// адаптивные классы одного блока). Раньше текст на телефоне держался
// только на горизонтальном градиенте поверх фото; при компактном герое
// строки нередко уезжали в его прозрачную часть и терялись на фотографии
// (особенно правый столбец плашек «Открытая кухня / Карма-баллы /
// Доставка»). На мобильном теперь стеклянная карточка снизу кадра —
// контраст гарантирован вне зависимости от того, что на фото под ней.
// Карточка нарочно короткая (заголовок и кнопки, без длинного абзаца и
// строки плашек) — раньше она закрывала почти всю фотографию, оставляя
// только узкую полоску фото сверху. На sm и шире карточки нет, работает
// прежний широкий градиент — там просто больше места и такой проблемы не было.
export async function Hero() {
  const banner = await getBanner("home-hero");

  return (
    <section className="site-hero mx-auto max-w-wrap px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3 md:px-8 md:pb-8 md:pt-6">
      <div className="relative isolate min-h-[520px] overflow-hidden rounded-[26px] border border-hair bg-tint-ivory shadow-l sm:min-h-[560px] sm:rounded-[30px] md:min-h-[680px] md:rounded-[38px]">
        <Image
          src={banner.imageUrl ?? ASSETS.backgrounds.heroTwoWorlds}
          alt="Рамен, роллы и выпечка Good Karma на сервированном столе"
          fill
          priority
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover object-[64%_center] md:object-center"
        />

        {/* Горизонтальный градиент — только sm и шире, для мобильной карточки не нужен. */}
        <div
          aria-hidden
          className="absolute inset-0 hidden sm:block sm:bg-[linear-gradient(90deg,rgb(var(--t-ivory))_0%,rgb(var(--t-ivory)/.97)_30%,rgb(var(--t-ivory)/.58)_48%,transparent_70%)]"
        />
        {/* Мобильный скрим снизу вверх — держит нижнюю треть кадра тёмной ещё
            до стеклянной карточки, чтобы даже яркое фото не спорило с текстом. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#1B1420]/60 via-[#1B1420]/10 to-transparent sm:hidden"
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

        {/* ===== Мобильный макет (< sm): компактная карточка внизу кадра ===== */}
        <div className="relative z-10 flex min-h-[520px] flex-col justify-end p-4 sm:hidden">
          <div className="hero-stagger-2 max-w-[86%] rounded-[22px] border border-white/60 bg-paper/90 p-3.5 shadow-[0_22px_50px_-26px_rgba(27,20,32,.55)] backdrop-blur-xl">
            <p className="hero-stagger-1 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-cherry">
              {banner.eyebrow}
            </p>
            <h1 className="hero-stagger-2 max-w-[12ch] text-[25px] font-extrabold leading-[1.06] tracking-[-0.03em] text-ink">
              {banner.title}
            </h1>
            <p className="hero-stagger-3 mt-1.5 line-clamp-1 text-[11.5px] font-medium leading-snug text-ink-2">
              {banner.text}
            </p>

            <div className="hero-stagger-3 mt-3 flex flex-wrap gap-2">
              <Link
                href={banner.href}
                className="btn-sheen inline-flex min-h-10 items-center justify-center rounded-full bg-plum-deep px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#F7EFF4] shadow-[0_10px_22px_-10px_rgba(41,21,36,.6)] transition duration-300 active:scale-95"
              >
                {banner.buttonLabel}
              </Link>
              <Link
                href="/wok-builder"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-plum/25 bg-paper-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink transition duration-300 active:scale-95"
              >
                Свой вок
              </Link>
            </div>
          </div>

          {/* Плашки вынесены из карточки прямо на фото — короткие, свои
              собственные тёмные подложки, не тянут карточку в высоту. */}
          <div className="hero-stagger-4 mt-3 flex flex-wrap gap-1.5">
            {["Открытая кухня", "Карма-баллы", "До 20 км"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/15 bg-[#1B1420]/45 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.05em] text-white/90 backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ===== Планшет и десктоп (≥ sm) — прежняя вёрстка без изменений ===== */}
        <div className="relative z-10 hidden min-h-[560px] flex-col p-10 sm:flex md:min-h-[680px] md:p-14 lg:p-16">
          <div className="hero-stagger-1 flex items-center gap-3">
            <span className="h-px w-8 bg-cherry/70" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-2 md:text-[11px]">
              Good Karma · Pan Asian Café
            </span>
          </div>

          <div className="my-auto max-w-[610px] py-12">
            <p className="hero-stagger-1 mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cherry">
              {banner.eyebrow}
            </p>
            <h1 className="hero-stagger-2 max-w-[10ch] text-[54px] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink md:text-[68px] lg:text-[78px]">
              {banner.title}
            </h1>
            <p className="hero-stagger-3 mt-6 max-w-[43ch] text-[14px] font-medium leading-[1.75] text-ink-2 md:text-[15px]">
              {banner.text}
            </p>

            <div className="hero-stagger-3 mt-8 flex flex-wrap gap-3">
              <Link
                href={banner.href}
                className="btn-sheen inline-flex min-h-12 items-center justify-center rounded-full bg-plum-deep px-8 text-[11px] font-bold uppercase tracking-[0.1em] text-[#F7EFF4] shadow-s transition duration-300 active:scale-95 motion-safe:hover:-translate-y-0.5 hover:shadow-m"
              >
                {banner.buttonLabel}
              </Link>
              <Link
                href="/wok-builder"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-plum/35 bg-paper/45 px-7 text-[11px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur-md transition duration-300 active:scale-95 motion-safe:hover:-translate-y-0.5 hover:border-plum hover:bg-paper/70"
              >
                Собрать свой вок
              </Link>
            </div>
          </div>

          <div className="hero-stagger-4 grid max-w-[720px] grid-cols-1 gap-2.5 border-t border-ink/15 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2 sm:grid-cols-3 sm:gap-6">
            <span>Открытая кухня</span>
            <span>Карма-баллы за заказ</span>
            <span>Доставка до 20 км</span>
          </div>
        </div>

        <div className="hero-stagger-4 absolute right-6 top-7 z-10 hidden items-center gap-3 text-[#F8F0EA]/75 md:flex">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]">良いカルマ</span>
          <span className="h-8 w-px bg-white/35" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Since 2018</span>
        </div>

        <div className="hero-stagger-4 absolute bottom-7 right-7 z-10 hidden gap-2 lg:flex">
          <Link
            href="/menu/rolls"
            className="rounded-full border border-white/30 bg-plum-deep/55 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F8F0EA] backdrop-blur-md transition duration-300 active:scale-95 hover:bg-plum-deep/75"
          >
            Япония · ロール
          </Link>
          <Link
            href="/menu/pizza"
            className="rounded-full border border-white/30 bg-plum-deep/55 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F8F0EA] backdrop-blur-md transition duration-300 active:scale-95 hover:bg-plum-deep/75"
          >
            Европа · Pizza
          </Link>
        </div>
      </div>
    </section>
  );
}

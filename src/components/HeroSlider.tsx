"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BackgroundFootage } from "@/components/BackgroundFootage";
import { CulturalAccent } from "@/components/CulturalAccent";
import { ArrowRight, Pause, Play } from "@/components/icons";
import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { HERO_FALLBACK_IMAGE, type HeroSlideContent } from "@/lib/heroSlides";
import { useAutoplay } from "@/lib/useAutoplay";

/** Сколько живёт один слайд главного экрана при автолистании. */
const SLIDE_MS = 7500;

/**
 * Главный экран — слайдер (слайды правятся в /admin/banners/hero).
 *
 * Все слайды лежат в одной ячейке CSS-grid: высота героя — по самому
 * высокому, при смене ничего не прыгает. Смена — растворение с медленным
 * «оседанием» фото (масштаб 1.06 → 1), текст активного слайда выходит
 * лесенкой. Время слайда отмеряет CSS-анимация полосы на вкладке, её
 * animationend листает дальше — тот же приём, что в карусели акций.
 *
 * Навигация — паттерн WAI-ARIA «tabbed carousel»: вкладки внизу (на
 * десктопе с подписями, на телефоне сегменты сверху, как в «историях»),
 * стрелки клавиатуры внутри списка вкладок, свайп на телефоне. Неактивные
 * слайды inert — фокус и скринридер в них не попадают.
 */
export function HeroSlider({ slides }: { slides: HeroSlideContent[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  // Фото остальных слайдов подгружаем после первого кадра — они не должны
  // конкурировать за сеть с главной (LCP) фотографией экрана.
  const [restImages, setRestImages] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = slides.length;
  const multi = count > 1;
  const { autoplay, running, userPaused, setUserPaused, bind } = useAutoplay(rootRef, { enabled: multi });

  useEffect(() => {
    const id = window.setTimeout(() => setRestImages(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const goTo = useCallback(
    (target: number) => {
      const index = ((target % count) + count) % count;
      setActive(index);
      setCycle((c) => c + 1);
    },
    [count],
  );

  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  // suffix — у мобильного и десктопного списков вкладок разные id: фокус
  // должен остаться в том списке, где сейчас пользователь.
  const onTabsKeyDown = (suffix: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const index = ((next % count) + count) % count;
    goTo(index);
    document.getElementById(tabId(index) + suffix)?.focus();
  };

  const tabState = (index: number) =>
    index < active ? "done" : index === active ? (autoplay ? "run" : "static") : "idle";

  return (
    <section
      className="site-hero mx-auto max-w-wrap px-3 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3 md:px-8 md:pb-8 md:pt-6"
      aria-roledescription="карусель"
      aria-label="Главное в Гуд Карме"
    >
      <div
        ref={rootRef}
        {...bind}
        onTouchStart={(event) => {
          const t = event.touches[0];
          touchStart.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const t = event.changedTouches[0];
          touchStart.current = null;
          if (!multi || !start || !t) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          // Только уверенный горизонтальный жест — вертикальная прокрутка
          // страницы не должна листать слайды.
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(active + (dx < 0 ? 1 : -1));
        }}
        className="relative isolate overflow-hidden rounded-[26px] border border-hair bg-tint-ivory shadow-l sm:rounded-[30px] md:rounded-[38px]"
      >
        <div className="grid">
          {slides.map((slide, index) => (
            <HeroSlideView
              key={slide.id}
              slide={slide}
              index={index}
              count={count}
              active={index === active}
              showImage={index === 0 || index === active || restImages}
              panelId={panelId(index)}
              tabId={multi ? tabId(index) : undefined}
            />
          ))}
        </div>

        {/* Подпись бренда — общая для всех слайдов, поверх них. */}
        {/* Тень текста: на светлых фото (белый край миски) подпись иначе исчезала. */}
        <div className="hero-stagger-4 pointer-events-none absolute right-6 top-7 z-20 hidden items-center gap-3 text-[#F8F0EA]/90 [text-shadow:0_1px_10px_rgb(27_20_32/.55)] md:flex">
          <span className="text-micro font-bold uppercase tracking-[0.22em]">良いカルマ</span>
          <span className="h-8 w-px bg-white/45 shadow-[0_0_8px_rgb(27_20_32/.4)]" aria-hidden />
          <span className="text-micro font-semibold uppercase tracking-[0.16em]">Since 2018</span>
        </div>

        {multi && (
          <>
            {/* ── Телефон: сегменты сверху, как в «историях» ── */}
            <div className="absolute inset-x-4 top-3.5 z-20 flex items-center gap-2 sm:hidden">
              <div role="tablist" aria-label="Слайды" onKeyDown={onTabsKeyDown("-m")} className="flex min-w-0 flex-1 gap-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    id={`${tabId(index)}-m`}
                    aria-selected={index === active}
                    aria-controls={panelId(index)}
                    aria-label={`${index + 1} из ${count}: ${slide.tabLabel}`}
                    tabIndex={index === active ? 0 : -1}
                    onClick={() => goTo(index)}
                    className="grid h-6 min-w-0 flex-1 place-items-center"
                  >
                    <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/35 shadow-[0_1px_4px_rgba(27,20,32,.25)]">
                      <HeroTabBar state={tabState(index)} running={running} cycleKey={index === active ? `${active}-${cycle}` : undefined} onDone={() => goTo(active + 1)} tone="light" />
                    </span>
                  </button>
                ))}
              </div>
              <PauseButton paused={userPaused} onToggle={() => setUserPaused((p) => !p)} hidden={!autoplay && !userPaused} tone="light" />
            </div>

            {/* ── Планшет и десктоп: подписанные вкладки внизу ── */}
            <div className="absolute inset-x-10 bottom-8 z-20 hidden items-end gap-5 sm:flex md:inset-x-14 md:bottom-10 lg:inset-x-16">
              <div
                role="tablist"
                aria-label="Слайды"
                onKeyDown={onTabsKeyDown("")}
                // Не шире светлого градиента слева: дальше подписи легли бы
                // прямо на фото блюда и потеряли контраст.
                className="grid min-w-0 max-w-[520px] flex-1 auto-cols-fr grid-flow-col gap-5"
              >
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    id={tabId(index)}
                    aria-selected={index === active}
                    aria-controls={panelId(index)}
                    tabIndex={index === active ? 0 : -1}
                    onClick={() => goTo(index)}
                    className="group min-w-0 pt-1 text-left"
                  >
                    <span className="block h-[2px] w-full overflow-hidden rounded-full bg-ink/15">
                      <HeroTabBar state={tabState(index)} running={running} cycleKey={index === active ? `${active}-${cycle}` : undefined} onDone={() => goTo(active + 1)} tone="dark" />
                    </span>
                    <span className="mt-3 flex min-w-0 items-baseline gap-2">
                      <span className="text-micro font-semibold tabular-nums text-ink-3">{String(index + 1).padStart(2, "0")}</span>
                      <span
                        className={cn(
                          "truncate text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300",
                          index === active ? "text-ink" : "text-ink-3 group-hover:text-ink-2",
                        )}
                      >
                        {slide.tabLabel}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <PauseButton paused={userPaused} onToggle={() => setUserPaused((p) => !p)} hidden={!autoplay && !userPaused} tone="dark" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function HeroSlideView({
  slide,
  index,
  count,
  active,
  showImage,
  panelId,
  tabId,
}: {
  slide: HeroSlideContent;
  index: number;
  count: number;
  active: boolean;
  showImage: boolean;
  panelId: string;
  tabId?: string;
}) {
  // Один h1 на страницу — у первого слайда (его же видит сервер и поисковик),
  // остальные — h2.
  const Heading = index === 0 ? "h1" : "h2";
  const titleSize = heroTitleSize(slide.title);

  // inert: у скрытого слайда нельзя сфокусировать кнопки и прочитать текст.
  // Ставим DOM-свойством: React 18 атрибут inert ещё не поддерживает.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.inert = !active;
  }, [active]);

  return (
    <div
      ref={ref}
      id={panelId}
      role={tabId ? "tabpanel" : undefined}
      aria-labelledby={tabId}
      aria-roledescription="слайд"
      aria-label={tabId ? undefined : slide.tabLabel}
      className={cn("hero-slide relative [grid-area:1/1]", active && "is-active")}
    >
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {showImage && (
          <Image
            src={slide.imageUrl ?? HERO_FALLBACK_IMAGE}
            alt=""
            fill
            priority={index === 0}
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="hero-slide__img object-cover object-[64%_center] md:object-center"
          />
        )}
        {/* Широкий светлый градиент слева — только с sm: там текст лежит прямо на фото. */}
        <div className="absolute inset-0 hidden sm:block sm:bg-[linear-gradient(90deg,rgb(var(--t-ivory))_0%,rgb(var(--t-ivory)/.97)_30%,rgb(var(--t-ivory)/.58)_48%,transparent_70%)]" />
        {/* Телефон: скрим снизу вверх под стеклянной карточкой и сверху — под сегментами. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1420]/60 via-[#1B1420]/10 to-[#1B1420]/25 sm:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum-deep/25 via-transparent to-white/10" />
        {/* Лепестки — между фото и текстом и только у активного слайда: у
            неактивных слайдов свой контекст наложения (opacity), общий слой
            поверх рамки оказался бы либо над текстом, либо под фото. */}
        {active && <BackgroundFootage src={ASSETS.animations.sakuraPetals} opacity={0.18} />}
      </div>

      {index === 0 && (
        <CulturalAccent world="japan" className="right-[2.5%] top-[15%] z-10 hidden h-[250px] w-[166px] opacity-70 lg:block" />
      )}

      {/* ===== Телефон (< sm): короткая стеклянная карточка внизу кадра ===== */}
      <div className="hero-slide__content relative z-10 flex min-h-[540px] flex-col justify-end p-4 pt-14 sm:hidden">
        <div className="hero-slide__copy max-w-[88%] rounded-[22px] border border-white/60 bg-paper/90 p-4 shadow-[0_22px_50px_-26px_rgba(27,20,32,.55)] backdrop-blur-xl">
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-cherry">{slide.eyebrow}</p>
          <Heading className="mt-1.5 max-w-[14ch] text-balance text-[25px] font-extrabold leading-[1.06] tracking-[-0.03em] text-ink">
            {slide.title}
          </Heading>
          <p className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-snug text-ink-2">{slide.text}</p>
          {/* Вторая кнопка на телефоне — тихая текстовая ссылка: две пилюли
              не помещаются в строку карточки и раздували её вдвое по высоте. */}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link
              href={slide.buttonHref}
              className="btn-sheen inline-flex min-h-11 items-center justify-center rounded-full bg-plum-deep px-4 text-micro font-bold uppercase tracking-[0.08em] text-[#F7EFF4] shadow-[0_10px_22px_-10px_rgba(41,21,36,.6)] transition duration-300 active:scale-95"
            >
              {slide.buttonLabel}
            </Link>
            {slide.secondaryLabel && slide.secondaryHref && (
              <Link
                href={slide.secondaryHref}
                className="inline-flex min-h-11 items-center gap-1 text-[12px] font-bold text-ink transition active:scale-95"
              >
                {slide.secondaryLabel}
                <ArrowRight className="text-[13px]" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Планшет и десктоп (≥ sm) ===== */}
      <div className="hero-slide__content relative z-10 hidden min-h-[580px] flex-col p-10 pb-32 sm:flex md:min-h-[700px] md:p-14 md:pb-36 lg:p-16 lg:pb-36">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-cherry/70" aria-hidden />
          <span className="text-micro font-bold uppercase tracking-[0.22em] text-ink-2 md:text-[11px]">
            Good Karma · Pan Asian Café
          </span>
        </div>

        <div className="hero-slide__copy my-auto max-w-[610px] py-10">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cherry">{slide.eyebrow}</p>
          <Heading className={cn("text-balance font-extrabold leading-[0.98] tracking-[-0.045em] text-ink", titleSize)}>
            {slide.title}
          </Heading>
          <p className="mt-6 line-clamp-4 max-w-[43ch] text-[14px] font-medium leading-[1.75] text-ink-2 md:text-[15px]">
            {slide.text}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={slide.buttonHref}
              className="btn-sheen inline-flex min-h-12 items-center justify-center rounded-full bg-plum-deep px-8 text-[11px] font-bold uppercase tracking-[0.1em] text-[#F7EFF4] shadow-s transition duration-300 active:scale-95 motion-safe:hover:-translate-y-0.5 hover:shadow-m"
            >
              {slide.buttonLabel}
            </Link>
            {slide.secondaryLabel && slide.secondaryHref && (
              <Link
                href={slide.secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-plum/35 bg-paper/45 px-7 text-[11px] font-bold uppercase tracking-[0.1em] text-ink backdrop-blur-md transition duration-300 active:scale-95 motion-safe:hover:-translate-y-0.5 hover:border-plum hover:bg-paper/70"
              >
                {slide.secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
      <span className="sr-only">{`Слайд ${index + 1} из ${count}`}</span>
    </div>
  );
}

/** Полоса прогресса на вкладке: scaleX-анимация, её конец листает слайд. */
function HeroTabBar({
  state,
  running,
  cycleKey,
  onDone,
  tone,
}: {
  state: "done" | "run" | "static" | "idle";
  running: boolean;
  cycleKey?: string;
  onDone: () => void;
  tone: "light" | "dark";
}) {
  return (
    <span
      key={cycleKey}
      data-state={state}
      className={cn("promo-seg block h-full w-full rounded-full", tone === "light" ? "bg-[#FFF8F2]" : "bg-plum-deep")}
      style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
      onAnimationEnd={onDone}
    />
  );
}

function PauseButton({
  paused,
  onToggle,
  hidden,
  tone,
}: {
  paused: boolean;
  onToggle: () => void;
  hidden: boolean;
  tone: "light" | "dark";
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "Запустить смену слайдов" : "Остановить смену слайдов"}
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition active:scale-90",
        tone === "light"
          ? "h-8 w-8 bg-[#1B1420]/35 text-[#FFF8F2] backdrop-blur-md"
          : "h-10 w-10 border border-ink/15 bg-paper/60 text-ink-2 backdrop-blur-md hover:border-plum/40 hover:text-ink",
      )}
    >
      {paused ? <Play className="text-[14px]" /> : <Pause className="text-[14px]" />}
    </button>
  );
}

/**
 * Размер заголовка по длине: слайды правит админ, и «Азия встречает
 * Европу» и длинная фраза на 60 символов не должны рисоваться одним кеглем.
 */
function heroTitleSize(title: string) {
  if (title.length <= 24) return "max-w-[11ch] text-[54px] md:text-[68px] lg:text-[78px]";
  if (title.length <= 40) return "max-w-[14ch] text-[46px] md:text-[56px] lg:text-[62px]";
  return "max-w-[18ch] text-[38px] md:text-[44px] lg:text-[50px]";
}

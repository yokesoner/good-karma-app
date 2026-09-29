"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "@/components/icons";
import { PromoCodeButton } from "@/components/PromoCodeButton";
import { PromoTimingChip } from "@/components/PromoTimingChip";
import { cn } from "@/lib/cn";
import { useAutoplay } from "@/lib/useAutoplay";
import type { StorefrontPromo } from "@/server/storefrontPromotions";

/** Сколько живёт один слайд при автопрокрутке. */
const SLIDE_MS = 6500;

/**
 * Карусель акций на главной — формат «историй», как в приложениях сетевых
 * ресторанов: один крупный слайд, сегменты прогресса, свайп.
 *
 * Прокрутка — нативный scroll-snap (свайп на телефоне бесплатно и без
 * библиотеки). Время слайда отмеряет CSS-анимация полоски в сегменте, а
 * её animationend переключает слайд: пауза — это просто
 * animation-play-state, прогресс при этом не теряется и не нужен таймер.
 *
 * Когда листать самой, решает общий useAutoplay (наведение, фокус,
 * скрытая вкладка, вне экрана, reduced motion). Кнопка паузы —
 * требование WCAG 2.2.2 к самодвижущемуся контенту.
 */
export function PromoCarousel({ promos }: { promos: StorefrontPromo[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // Пока карусель сама прокручивает ленту, наблюдатель за слайдами видит
  // промежуточные — их нельзя принимать за выбор пользователя.
  const programmaticUntil = useRef(0);

  const [active, setActive] = useState(0);
  // Номер «прохода» слайда: меняется при каждом переключении и
  // перезапускает анимацию полоски, даже если индекс тот же.
  const [cycle, setCycle] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;

  const count = promos.length;
  const multi = count > 1;
  const { reducedMotion, autoplay, running, userPaused, setUserPaused, bind } = useAutoplay(rootRef, { enabled: multi });

  // Свайп пользователя: активным становится слайд, занявший бо́льшую часть ленты.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !multi) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticUntil.current) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = slides.indexOf(entry.target as HTMLElement);
          if (index < 0 || index === activeRef.current) continue;
          setActive(index);
          setCycle((c) => c + 1);
        }
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((slide) => io.observe(slide));
    return () => io.disconnect();
  }, [multi, count]);

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      const index = ((target % count) + count) % count;
      setActive(index);
      setCycle((c) => c + 1);
      const slide = track?.children[index] as HTMLElement | undefined;
      if (!track || !slide) return;
      programmaticUntil.current = Date.now() + 800;
      track.scrollTo({ left: slide.offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [count, reducedMotion],
  );

  if (count === 0) return null;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="карусель"
      aria-label="Акции"
      {...bind}
      onKeyDown={(e) => {
        if (!multi) return;
        if (e.key === "ArrowRight") goTo(active + 1);
        if (e.key === "ArrowLeft") goTo(active - 1);
      }}
    >
      <div
        ref={trackRef}
        // Во время автопрокрутки скринридеру не нужно объявлять каждую
        // смену слайда; на паузе — пусть объявляет выбранный вручную.
        aria-live={running ? "off" : "polite"}
        className="promo-track relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {promos.map((promo, index) => (
          <PromoSlide
            key={promo.code}
            promo={promo}
            index={index}
            count={count}
            active={index === active}
            peek={multi}
          />
        ))}
      </div>

      {multi && (
        <div className="mt-4 flex items-center gap-3 sm:mt-5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5" role="group" aria-label="Выбор акции">
            {promos.map((promo, index) => {
              const state = index < active ? "done" : index === active ? (autoplay ? "run" : "static") : "idle";
              return (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Акция ${index + 1} из ${count}: ${promo.discount}${promo.label ? `, ${promo.label}` : ""}`}
                  aria-current={index === active ? "true" : undefined}
                  className="group grid h-8 min-w-0 flex-1 place-items-center"
                >
                  <span className="block h-[3px] w-full overflow-hidden rounded-full bg-ink/10 transition-colors group-hover:bg-ink/20">
                    <span
                      key={index === active ? `${active}-${cycle}` : undefined}
                      data-state={state}
                      className="promo-seg block h-full w-full rounded-full bg-plum-deep"
                      style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => goTo(active + 1)}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Запустить автопрокрутку акций" : "Остановить автопрокрутку акций"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hair text-ink-2 transition hover:border-plum/40 hover:text-ink active:scale-90"
            >
              {userPaused ? <Play className="text-[15px]" /> : <Pause className="text-[15px]" />}
            </button>
          )}
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Предыдущая акция"
              className="grid h-10 w-10 place-items-center rounded-full border border-hair text-ink transition hover:border-plum/40 hover:bg-paper-2 active:scale-90"
            >
              <ArrowLeft className="text-[16px]" />
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Следующая акция"
              className="grid h-10 w-10 place-items-center rounded-full bg-btn text-btn-fg shadow-s transition hover:shadow-m active:scale-90"
            >
              <ArrowRight className="text-[16px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoSlide({
  promo,
  index,
  count,
  active,
  peek,
}: {
  promo: StorefrontPromo;
  index: number;
  count: number;
  active: boolean;
  /** На телефоне у ленты из нескольких слайдов край следующего выглядывает — подсказка, что можно листать. */
  peek: boolean;
}) {
  // Фотография — тёмный слайд со светлым текстом; без неё — пастельный
  // пресет фона из админки и тёмный текст.
  const onPhoto = Boolean(promo.image);
  const live = promo.timing.state === "live";
  // Структурированные условия (минимальная сумма, расписание) живут на
  // талоне в /promotions — ссылка «Условия» ведёт туда. В слайде они
  // почти всегда дублировали бы текст описания, написанный админом.

  return (
    <article
      role="group"
      aria-roledescription="слайд"
      aria-label={`${index + 1} из ${count}: ${promo.discount}${promo.headline ? ` — ${promo.headline}` : ""}`}
      className={cn(
        "promo-slide relative isolate flex min-h-[470px] shrink-0 snap-start overflow-hidden rounded-[28px] sm:min-h-[440px] md:rounded-[34px]",
        peek ? "w-[calc(100%-2.25rem)] md:w-full" : "w-full",
        active && "is-active",
        onPhoto ? "bg-[#24161F] text-[#FFF8F2]" : cn("bg-gradient-to-br text-[#3A2338]", promo.background),
      )}
    >
      {promo.image ? (
        <>
          <Image
            src={promo.image.url}
            alt={promo.image.alt}
            fill
            priority={index === 0}
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="promo-slide__photo object-cover object-[70%_center]"
          />
          {/* На телефоне текст внизу — затемняем снизу; на десктопе текст
              слева — затемняем слева, фотография справа остаётся живой. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#1B1119] via-[#1B1119]/70 to-[#1B1119]/0 md:bg-gradient-to-r md:from-[#1B1119]/95 md:via-[#1B1119]/65 md:to-transparent"
          />
        </>
      ) : (
        <>
          <div aria-hidden className="promo-rings absolute -right-16 -top-16 h-72 w-72 opacity-60" />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 right-4 select-none text-[180px] font-extrabold leading-none tracking-[-0.08em] text-[#3A2338]/[0.06] md:right-12 md:text-[260px]"
          >
            {promo.discount}
          </span>
        </>
      )}

      <div className="promo-slide__content relative z-10 mt-auto flex w-full max-w-[580px] flex-col p-6 sm:p-9 md:my-auto md:p-12">
        <div className="flex flex-wrap items-center gap-2">
          {promo.label && (
            <span
              className={cn(
                "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em]",
                onPhoto ? "bg-[#FFF8F2] text-[#3A2338]" : "bg-[#3A2338] text-[#FFF8F2]",
              )}
            >
              {promo.label}
            </span>
          )}
          <PromoTimingChip timing={promo.timing} tone={onPhoto ? "dark" : "light"} />
        </div>

        <div className="mt-5 text-[68px] font-extrabold leading-[0.86] tracking-[-0.06em] sm:text-[88px] md:text-[108px]">
          {promo.discount}
        </div>
        {promo.headline && (
          <h3 className="mt-4 line-clamp-2 max-w-[22ch] text-[21px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[26px]">
            {promo.headline}
          </h3>
        )}
        <p className={cn("mt-3 line-clamp-2 max-w-[44ch] text-[13.5px] leading-relaxed md:text-[14.5px]", onPhoto ? "text-[#FFF8F2]/75" : "text-[#3A2338]/75")}>
          {promo.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          {live ? (
            <PromoCodeButton code={promo.code} variant={onPhoto ? "onDark" : "solid"} />
          ) : (
            // Код ещё не действует — показываем его, но не даём «применить»:
            // на чекауте сервер всё равно отклонил бы его до начала окна.
            <span
              className={cn(
                "inline-flex min-h-12 items-center rounded-full border border-dashed px-5 text-[11px] font-bold uppercase tracking-[0.12em]",
                onPhoto ? "border-[#FFF8F2]/40 text-[#FFF8F2]/85" : "border-[#3A2338]/30 text-[#3A2338]/80",
              )}
            >
              Код {promo.code}
            </span>
          )}
          <Link
            href={`/promotions#promo-${promo.code}`}
            tabIndex={active ? undefined : -1}
            className={cn(
              "group/link inline-flex min-h-11 items-center gap-1.5 text-[12px] font-bold",
              onPhoto ? "text-[#FFF8F2]" : "text-[#3A2338]",
            )}
          >
            Условия
            <ArrowRight className="text-[14px] transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}

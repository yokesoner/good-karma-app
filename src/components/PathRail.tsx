"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Каркас «пути» Karma Club — общий для пути уровней и пути подарков
 * (на /promotions и в профиле): лента карточек вбок, над ними золотая нить
 * с узлами, заполненная до текущего баланса. Сами карточки передаются
 * детьми (<PathStop>), каркас отвечает за ленту, стрелки, затухание краёв
 * и нить — чтобы оба пути выглядели и вели себя одинаково.
 *
 * Лента листается при любом числе карточек из админки. Появление — через
 * общий data-reveal (RevealOnScroll): карточки за правым краем ленты
 * проявляются, когда до них докрутят.
 */
export function PathRail({
  title,
  headingAs: Heading = "h3",
  subtitle,
  listLabel,
  count,
  progress,
  headerAside,
  children,
}: {
  title: string;
  /** Уровень заголовка: h3 внутри блока клуба, h2 — самостоятельная секция (профиль). */
  headingAs?: "h2" | "h3";
  subtitle: React.ReactNode;
  listLabel: string;
  count: number;
  /** Заполненность нити 0..1 между центрами первой и последней карточки. */
  progress: number;
  /** Дополнительный элемент в шапке рядом со стрелками. */
  headerAside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  // Состояние краёв ленты: гасим стрелку у края и убираем затухание там,
  // где листать дальше некуда.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [count]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    const card = el?.querySelector<HTMLElement>("[data-path-stop]");
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: reduce ? "auto" : "smooth" });
  };

  const arrow =
    "grid h-10 w-10 place-items-center rounded-full border border-hair text-ink transition hover:border-plum/40 active:scale-90 disabled:opacity-35";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Heading className="text-[19px] font-bold tracking-[-0.02em] sm:text-[22px]">{title}</Heading>
          <p className="mt-1 max-w-[62ch] text-[12.5px] leading-snug text-ink-2">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {headerAside}
          {count > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => scrollByCard(-1)} disabled={edges.start} aria-label={`${title}: назад`} className={arrow}>
                <ArrowLeft className="text-[16px]" />
              </button>
              <button type="button" onClick={() => scrollByCard(1)} disabled={edges.end} aria-label={`${title}: дальше`} className={arrow}>
                <ArrowRight className="text-[16px]" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollerRef}
        data-fade-start={edges.start ? undefined : ""}
        data-fade-end={edges.end ? undefined : ""}
        className="path-scroller snap-row -mx-5 overflow-x-auto scroll-px-5 px-5 pb-4 sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        <ol
          aria-label={listLabel}
          data-reveal="fade"
          className="path-rail relative flex w-max gap-4 pt-1 [--card:228px] sm:[--card:252px]"
          style={{ ["--progress" as string]: progress }}
        >
          {/* Нить от центра первой карточки до центра последней. */}
          <span aria-hidden className="pointer-events-none absolute left-[calc(var(--card)/2)] right-[calc(var(--card)/2)] top-[15px] h-[2px] rounded-full bg-hair">
            <span className="path-thread__fill absolute inset-0 rounded-full bg-gradient-to-r from-cherry via-[#C98A6B] to-gold" />
          </span>
          {children}
        </ol>
      </div>
    </div>
  );
}

export type PathNodeState = "done" | "current" | "locked" | "neutral";

/** Одна остановка пути: узел на нити и карточка под ним. */
export function PathStop({
  index,
  node,
  progress = 0,
  state,
  children,
}: {
  index: number;
  node: { state: PathNodeState; label?: React.ReactNode };
  /** Шкала внутри карточки (0..1) — анимируется вместе с появлением. */
  progress?: number;
  /** Произвольное состояние карточки для стилей (data-state). */
  state: string;
  children: React.ReactNode;
}) {
  return (
    <li
      data-path-stop
      data-reveal
      data-state={state}
      style={{ ["--reveal-delay" as string]: `${Math.min(index, 6) * 70}ms`, ["--p" as string]: progress }}
      className="path-stop group flex w-[var(--card)] shrink-0 flex-col items-center"
    >
      <span
        aria-hidden
        className={cn(
          "relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 border-paper-2 text-[12px] font-bold shadow-s",
          node.state === "done" && "bg-gradient-to-br from-gold to-[#9C7C45] text-white",
          node.state === "current" && "journey-here bg-cherry text-white",
          node.state === "locked" && "bg-paper-3 text-ink-3",
          node.state === "neutral" && "bg-paper text-ink-2",
        )}
      >
        {node.state === "done" ? (
          <Check className="text-[15px]" strokeWidth={2.2} />
        ) : node.state === "locked" ? (
          <Lock className="text-[14px]" />
        ) : (
          node.label ?? index + 1
        )}
      </span>
      {children}
    </li>
  );
}

/** Шкала внутри карточки: заполняется до --p, когда карточка появляется. */
export function PathBar({ tone = "warm" }: { tone?: "warm" | "light" }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full", tone === "light" ? "bg-white/20" : "bg-hair-soft")}>
      <span className={cn("path-bar block h-full rounded-full", tone === "light" ? "bg-gradient-to-r from-[#F0AFC3] to-[#F7D9A6]" : "bg-gradient-to-r from-cherry to-gold")} />
    </div>
  );
}

/**
 * Позиция на нити 0..1: карточки стоят равномерно, поэтому внутри отрезка
 * между соседними остановками позиция интерполируется по баллам, а не
 * линейно по всей шкале (пороги 0/500/1200/2500/4000 нелинейны).
 */
export function threadProgress(balance: number, stops: number[]): number {
  const last = stops.length - 1;
  if (last <= 0) return balance >= (stops[0] ?? 0) ? 1 : 0;
  if (balance <= stops[0]!) return 0;
  if (balance >= stops[last]!) return 1;
  for (let i = 0; i < last; i++) {
    const from = stops[i]!;
    const to = stops[i + 1]!;
    if (balance >= from && balance < to) return (i + (balance - from) / (to - from)) / last;
  }
  return 1;
}

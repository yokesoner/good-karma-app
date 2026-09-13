"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Золотая линия, дорисовывающая себя при появлении в кадре — сквозной
 * мотив «Кинцуги-стол» (см. AGENTS.md/CLAUDE.md). Один и тот же элемент
 * везде на сайте: тонкий золотой шов, а не декоративная заглушка.
 * prefers-reduced-motion: линия сразу целая, без анимации.
 */
export function GoldHairline({ width = 32, className }: { width?: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden
      width={width}
      height={2}
      viewBox={`0 0 ${width} 2`}
      className={cn("kintsugi-line flex-none overflow-visible", className)}
    >
      <line
        x1="0"
        y1="1"
        x2={width}
        y2="1"
        stroke="rgb(var(--gold))"
        strokeWidth="1"
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ strokeDasharray: width, strokeDashoffset: drawn ? 0 : width }}
      />
    </svg>
  );
}

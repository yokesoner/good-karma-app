"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const TILT_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Наклон талона за курсором и блик, который едет за ним, — как у карты
 * KarmaPass, но без React-состояния: координаты пишутся CSS-переменными
 * прямо в style элемента раз в кадр (requestAnimationFrame), так что
 * движение мыши не вызывает ни одного ререндера. Только мышь и только без
 * reduced motion — на тач-экране и при отключённой анимации талон статичен.
 */
export function TicketTilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse" || !window.matchMedia(TILT_QUERY).matches) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--rx", `${((0.5 - py) * 5).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((px - 0.5) * 7).toFixed(2)}deg`);
      el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
      el.dataset.tilting = "";
    });
  };

  const onPointerLeave = () => {
    const el = ref.current;
    cancelAnimationFrame(frame.current);
    if (!el) return;
    for (const name of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(name);
    delete el.dataset.tilting;
  };

  return (
    <div ref={ref} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className={cn("promo-tilt", className)}>
      {children}
    </div>
  );
}

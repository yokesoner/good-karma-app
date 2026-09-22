"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Плавное появление секции при подскролле — тот же IntersectionObserver,
 * что у GoldHairline, но для целых блоков, а не одной линии. Использовать
 * на смысловых секциях лендинга, не на каждом div подряд: если анимируется
 * почти всё, ощущение премиальности пропадает.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      // threshold: 0 — срабатывает, как только верх секции зашёл в экран.
      // Раньше стояло 0.15: у высокой секции на телефоне 15% высоты — это
      // сотни пикселей, и она оставалась пустой, пока пользователь не
      // доскроллит до середины.
      { threshold: 0, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-[820ms] ease-[cubic-bezier(.2,.8,.2,1)]",
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

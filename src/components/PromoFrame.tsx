import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Editorial-обрамление акций: тонкая внутренняя рамка + четыре уголковые
 * засечки. Декор — абсолютные оверлеи, а вёрстка контента задаётся
 * через contentClassName и попадает НАПРЯМУЮ на контейнер детей.
 *
 * Раньше children оборачивались в лишний div, из-за чего grid-колонки,
 * переданные снаружи, применялись к обёртке, а не к тексту с фото —
 * флагманская акция ломалась в одну колонку.
 */
export function PromoFrame({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-l border border-plum/30",
        "bg-gradient-to-br from-tint-cream via-tint-sakura to-tint-plum",
        "transition-shadow duration-500 hover:shadow-m",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[9px] z-10 rounded-[17px] border border-plum/20"
      />
      {(
        [
          "left-[5px] top-[5px] border-l border-t",
          "right-[5px] top-[5px] border-r border-t",
          "left-[5px] bottom-[5px] border-l border-b",
          "right-[5px] bottom-[5px] border-r border-b",
        ] as const
      ).map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={cn("pointer-events-none absolute z-10 h-[9px] w-[9px] border-cherry/60", pos)}
        />
      ))}
      <div className={cn("relative z-0", contentClassName)}>{children}</div>
    </div>
  );
}

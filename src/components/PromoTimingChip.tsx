import { cn } from "@/lib/cn";
import type { PromoTiming } from "@/lib/promoSchedule";

/**
 * «Идёт сейчас · до 18:00» / «Начнётся · сегодня с 15:00». Живая точка
 * пульсирует только у идущей акции — это единственное движение в чипе,
 * и оно несёт смысл: «можно воспользоваться прямо сейчас».
 */
export function PromoTimingChip({
  timing,
  tone = "light",
  className,
}: {
  timing: PromoTiming;
  /** light — на светлой карточке; dark — поверх фотографии. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const live = timing.state === "live";
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold leading-none",
        tone === "dark"
          ? "border border-white/20 bg-black/25 text-[#FFF8F2] backdrop-blur-md"
          : live
            ? "bg-tint-mint text-ink"
            : "bg-tint-gold text-ink",
        className,
      )}
    >
      <span aria-hidden className={cn("promo-live-dot relative h-2 w-2 shrink-0 rounded-full", live ? "bg-[#4FA27F]" : "bg-gold")} data-live={live || undefined} />
      <span>
        {live ? "Идёт сейчас" : "Начнётся"}
        {timing.note ? <span className={tone === "dark" ? "text-[#FFF8F2]/75" : "text-ink-2"}> · {timing.note}</span> : null}
      </span>
    </span>
  );
}

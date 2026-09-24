"use client";

import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LevelIcon } from "@/components/LevelIcon";
import { cn } from "@/lib/cn";

type KarmaPassProps = {
  name?: string | null;
  phone?: string | null;
  points: number;
  level: string;
  levelIcon?: string;
  progressPct?: number;
  className?: string;
  compact?: boolean;
  preview?: boolean;
};

const maskedPhone = (phone?: string | null) => {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "Good Karma Club";
};

export function KarmaPass({
  name,
  phone,
  points,
  level,
  levelIcon = "blossom",
  progressPct = 64,
  className,
  compact = false,
  preview = false,
}: KarmaPassProps) {
  // Наклон следует за курсором, а не фиксированный угол на :hover — эффект
  // карты в Apple Wallet. JS включается только там, где уже разрешён CSS-
  // вариант (мышь, наведение, no-preference): touch и reduced-motion молча
  // получают статичную карту.
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 10, y: (px - 0.5) * 14 });
  };

  return (
    <article
      aria-label={preview ? "Образец карты Karma Club — баланс доступен в профиле" : `Карта Karma Club, уровень ${level}, ${points} баллов`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt(null)}
      style={
        tilt
          ? {
              transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`,
              transition: "transform 80ms linear",
            }
          : undefined
      }
      className={cn(
        "karma-pass group relative isolate w-full min-w-0 max-w-[560px] overflow-hidden rounded-[30px] border border-[#D6BA85]/40 p-5 text-[#FFF9F3] shadow-[0_38px_80px_-32px_rgba(48,24,43,.75)] md:p-8",
        compact && "max-w-[470px] rounded-[26px] p-5 md:p-6",
        className,
      )}
    >
      <div aria-hidden className="karma-pass__mesh absolute inset-0" />
      <div aria-hidden className="karma-pass__orb absolute -right-[16%] -top-[28%] aspect-square w-[68%] rounded-full" />
      <div aria-hidden className="karma-pass__sheen absolute inset-y-0 -left-2/3 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <svg aria-hidden viewBox="0 0 560 350" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-[#E3C58E]/40" fill="none">
        <path d="M410 0 385 67 422 104 386 161 446 214 433 263 478 350M422 104 492 87 560 108M446 214 515 206 560 230" stroke="currentColor" strokeWidth="1" />
      </svg>

      <div className={cn("relative flex min-h-[240px] flex-col justify-between gap-6", compact && "min-h-[215px]")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
              <BrandMark className="h-6 w-6 text-[#FFD8E5]" />
            </span>
            <div>
              <b className="block text-[10px] font-bold uppercase tracking-[0.12em]">Good Karma</b>
              <span className="mt-0.5 block text-[7.5px] font-semibold uppercase tracking-[0.25em] text-white/50">
                {preview ? "Образец карты" : "Club Pass"}
              </span>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
            <LevelIcon name={levelIcon} className="h-3.5 w-3.5 text-[#F7D9A6]" />
            {preview ? "Club" : level}
          </span>
        </div>

        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/50">
            {preview ? "Маленькие ритуалы. Большая любовь." : "Баланс кармы"}
          </span>
          <div className={cn("mt-1 font-bold leading-none tracking-[-0.055em]", compact ? "text-[42px]" : "text-[52px] md:text-[62px]") }>
            {preview ? <span className="block text-[clamp(22px,11cqw,36px)] leading-[1.08] tracking-[-0.035em]">Хорошее<br />возвращается.</span> : <>{new Intl.NumberFormat("ru-RU").format(points)}<span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">баллов</span></>}
          </div>
        </div>

        <div>
          {!preview && <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F0AFC3] to-[#F7D9A6] shadow-[0_0_14px_rgba(247,217,166,.55)]"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <b className={cn("block text-[10px] font-bold uppercase tracking-[0.12em]", !preview && "max-w-[22ch] truncate")}>
                {preview ? "Ваша карта — в профиле" : name || "Гость Гуд Кармы"}
              </b>
              <span className="mt-1 block text-[8px] tracking-[0.12em] text-white/70">{preview ? "Баллы · уровни · подарки" : maskedPhone(phone)}</span>
            </div>
            <span className="text-[13px] tracking-[0.22em] text-[#F7D9A6]">良いカルマ</span>
          </div>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/cn";

/**
 * Кнопка акции делает две вещи сразу: копирует код в буфер (человек может
 * поделиться им) и применяет его к текущей корзине, чтобы на чекауте он уже
 * стоял в поле. Раньше это была просто картинка с текстом промокода — по ней
 * нельзя было даже кликнуть.
 */
export function PromoCodeButton({
  code,
  variant = "solid",
  className,
}: {
  code: string;
  /** solid — на светлом фоне; ghost — вторичная на пастельной карточке; onDark — поверх фотографии. */
  variant?: "solid" | "ghost" | "onDark";
  className?: string;
}) {
  const applied = useCart((s) => s.promoCode);
  const setPromo = useCart((s) => s.setPromo);
  const [copied, setCopied] = useState(false);
  // Корзина живёт в localStorage: до гидратации считаем код не применённым,
  // иначе серверная и клиентская разметка кнопки разойдутся.
  const [mounted, setMounted] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setMounted(true);
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);
  const isApplied = mounted && applied === code;

  const handle = async () => {
    setPromo(code);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер может быть недоступен (http, отказ в правах) — не страшно,
      // промокод всё равно применён к корзине.
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={isApplied}
      aria-label={isApplied ? `Промокод ${code} добавлен в корзину` : `Применить промокод ${code}`}
      className={cn(
        "inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] transition duration-300 motion-safe:active:scale-[0.97]",
        variant === "solid" && "btn-sheen bg-btn text-btn-fg shadow-s hover:shadow-m",
        variant === "ghost" &&
          "border border-[#493044]/25 bg-[#FBF8F2]/50 text-[#493044] hover:border-[#493044]/60 hover:bg-[#FBF8F2]/80",
        variant === "onDark" && "btn-sheen bg-[#FFF8F2] text-[#3A2338] shadow-m hover:bg-white",
        isApplied && (variant === "onDark" ? "ring-2 ring-gold/70" : "ring-1 ring-cherry"),
        className,
      )}
    >
      {(copied || isApplied) && <Check key={copied ? "copied" : "applied"} className="icon-pop text-[14px]" />}
      <span aria-live="polite" aria-atomic="true">
        {copied ? "Скопировано" : isApplied ? `${code} применён` : `Применить ${code}`}
      </span>
    </button>
  );
}

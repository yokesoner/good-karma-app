"use client";

import { useEffect, useRef, useState } from "react";
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
}: {
  code: string;
  variant?: "solid" | "ghost";
}) {
  const applied = useCart((s) => s.promoCode);
  const setPromo = useCart((s) => s.setPromo);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const isApplied = applied === code;

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
        "inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] transition motion-safe:active:scale-[0.98]",
        variant === "solid"
          ? "bg-btn text-btn-fg hover:opacity-90"
          : "border border-[#493044]/25 bg-[#FBF8F2]/50 text-[#493044] hover:border-[#493044]/60 hover:bg-[#FBF8F2]/80",
        isApplied && "ring-1 ring-cherry",
      )}
    >
      <span aria-live="polite" aria-atomic="true">{copied ? "Скопировано ✓" : isApplied ? `${code} применён ✓` : `Применить ${code}`}</span>
    </button>
  );
}

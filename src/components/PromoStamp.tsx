"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/cn";

/**
 * Печать-ханко на талоне, промокод которого уже в корзине. Тот же сигнал,
 * что «применён» на кнопке, но на уровне всей карточки: пролистывая талоны,
 * видно, какой из них уже «погашен» для текущего заказа. Печать падает
 * сверху с лёгким доворотом — как настоящий штамп; при reduced motion
 * просто появляется.
 */
export function PromoStamp({ code, className }: { code: string; className?: string }) {
  const applied = useCart((s) => s.promoCode);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || applied !== code) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "promo-stamp pointer-events-none absolute grid h-[84px] w-[84px] place-items-center rounded-full border-[2.5px] border-cherry/80 text-center text-cherry/85",
        className,
      )}
    >
      <span className="absolute inset-[5px] rounded-full border border-cherry/50" />
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-[17px] font-bold">良</span>
        <span className="mt-1 text-micro font-extrabold uppercase tracking-[0.1em]">в корзине</span>
      </span>
    </span>
  );
}

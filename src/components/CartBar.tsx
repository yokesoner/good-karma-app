"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Bag } from "@/components/icons";
import { cartCount, cartSubtotalCents, useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

// Страницы, где плавающая корзина только мешает: там уже есть своя
// закреплённая панель или сама корзина/оформление.
const HIDDEN_ON = ["/checkout", "/wok-builder", "/product/", "/order/", "/profile"];

// Плавающая панель «Корзина · 2 · 1 337 ₽» над нижней навигацией — только
// на телефоне. Даёт то, чего не даёт значок-счётчик: сумму заказа и путь к
// корзине одним тапом с любого экрана меню, как в приложениях доставки.
export function CartBar({ onOpen }: { onOpen: () => void }) {
  const lines = useCart((s) => s.lines);
  const pathname = usePathname();
  // Корзина живёт в localStorage — до гидратации показываем пусто, иначе
  // разметка сервера и клиента разойдётся.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? cartCount(lines) : 0;
  const hidden = HIDDEN_ON.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
  if (count === 0 || hidden) return null;

  const subtotal = cartSubtotalCents(lines);

  return (
    <>
      {/* Освобождает место в конце страницы, чтобы панель не закрывала последний блок */}
      <div aria-hidden className="h-16 md:hidden" />
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Открыть корзину: ${count} шт., ${formatMoney(subtotal)}`}
        className="btn-sheen cart-bar-in fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] z-30 flex min-h-[52px] items-center gap-3 rounded-full bg-btn px-2 py-2 pl-2.5 pr-5 text-btn-fg shadow-[0_18px_40px_-16px_rgba(35,20,32,.7)] transition duration-200 active:scale-[0.98] md:hidden"
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-btn-fg/15">
          <Bag className="h-[18px] w-[18px]" />
          <span
            key={count}
            className="icon-pop absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-cherry px-1 text-[10px] font-bold text-white"
          >
            {count}
          </span>
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Корзина</span>
        <span key={subtotal} className="wok-value-in ml-auto text-[15px] font-bold tabular-nums">
          {formatMoney(subtotal)}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
      </button>
    </>
  );
}

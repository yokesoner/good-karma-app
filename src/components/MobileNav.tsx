"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { NavIcon } from "@/components/NavIcon";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/menu", label: "Меню", icon: "grid" },
  { href: "/promotions", label: "Акции", icon: "spark" },
  { href: "/profile", label: "Профиль", icon: "user" },
] as const;

// Только на мобильных — на md и шире навигация уже есть в Header.
export function MobileNav({ onCartClick }: { onCartClick: () => void }) {
  const lines = useCart((s) => s.lines);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/60 bg-paper/86 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_48px_-28px_rgba(35,20,32,.55)] backdrop-blur-2xl md:hidden"
    >
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] transition duration-200 active:scale-90",
              active ? "text-ink" : "text-ink-3",
            )}
          >
            <NavIcon name={item.icon} />
            {item.label}
            {active && <span aria-hidden className="icon-pop absolute top-0 h-0.5 w-5 rounded-full bg-cherry" />}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCartClick}
        aria-label={count > 0 ? `Корзина, товаров: ${count}` : "Корзина"}
        className="relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 transition duration-200 active:scale-90 hover:text-ink"
      >
        <NavIcon name="cart" />
        Корзина
        {count > 0 && (
          <span key={count} className="icon-pop absolute right-[24%] top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-cherry px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
    </nav>
  );
}

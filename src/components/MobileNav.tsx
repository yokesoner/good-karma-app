"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/menu", label: "Меню", icon: "grid" },
  { href: "/promotions", label: "Акции", icon: "spark" },
  { href: "/profile", label: "Профиль", icon: "user" },
] as const;

type NavIconName = (typeof NAV)[number]["icon"] | "cart";

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === "grid" && (
        <>
          <rect x="4" y="4" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.8" y="4" width="6.2" height="6.2" rx="1.4" />
          <rect x="4" y="13.8" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.8" y="13.8" width="6.2" height="6.2" rx="1.4" />
        </>
      )}
      {name === "spark" && <path d="M12 3l1.7 6.1L20 11l-6.3 1.9L12 19l-1.7-6.1L4 11l6.3-1.9L12 3Z" />}
      {name === "user" && (
        <>
          <circle cx="12" cy="8.2" r="3.6" />
          <path d="M4.8 20c.7-3.7 3.6-5.9 7.2-5.9s6.5 2.2 7.2 5.9" />
        </>
      )}
      {name === "cart" && (
        <>
          <path d="M3 4.2h2.2l2.3 10.4h9.3l1.9-7.3H6.3" />
          <circle cx="9.6" cy="18.6" r="1.4" />
          <circle cx="16.8" cy="18.6" r="1.4" />
        </>
      )}
    </svg>
  );
}

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
              "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] transition",
              active ? "text-ink" : "text-ink-3",
            )}
          >
            <NavIcon name={item.icon} />
            {item.label}
            {active && <span aria-hidden className="absolute top-0 h-0.5 w-5 rounded-full bg-cherry" />}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onCartClick}
        aria-label={count > 0 ? `Корзина, товаров: ${count}` : "Корзина"}
        className="relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 transition hover:text-ink"
      >
        <NavIcon name="cart" />
        Корзина
        {count > 0 && (
          <span className="absolute right-[24%] top-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-cherry px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
    </nav>
  );
}

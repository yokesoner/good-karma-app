"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { NavIcon } from "@/components/NavIcon";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/menu", label: "Меню" },
  { href: "/promotions", label: "Акции" },
  { href: "/profile", label: "Профиль" },
];

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const lines = useCart((s) => s.lines);
  const pathname = usePathname();
  // Корзина живёт в localStorage, на сервере её нет — до гидратации
  // показываем ноль, иначе разметка сервера и клиента разойдётся.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/55 bg-paper/78 shadow-[0_12px_40px_-32px_rgba(58,35,56,.55)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-wrap items-center gap-2 px-5 py-3 sm:gap-4 md:px-16">
        <Link href="/" className="mr-auto flex shrink-0 items-center gap-3 whitespace-nowrap leading-none">
          <BrandMark className="h-8 w-8 text-cherry" />
          <span>
            <span className="block text-[15px] font-bold uppercase tracking-[0.085em]">
              Гуд Карма
            </span>
            <span className="mt-1 block text-[7.5px] font-medium uppercase tracking-[0.27em] text-ink-3">
              Pan Asian Café
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-full border border-white/65 bg-paper-2/58 p-1 shadow-[0_10px_26px_-22px_rgba(58,35,56,.55)] backdrop-blur-xl md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2.5 text-[11px] font-semibold transition hover:text-ink",
                  active ? "bg-tint-sakura text-ink shadow-s" : "text-ink-2",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={onCartClick}
            aria-label={count > 0 ? `Корзина, товаров: ${count}` : "Корзина"}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-hair-soft hover:text-ink"
          >
            <NavIcon name="cart" className="h-[19px] w-[19px]" strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-0.5 top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-cherry px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { MobileNav } from "@/components/MobileNav";
import { cn } from "@/lib/cn";

// Шапка, панель корзины и мобильная нижняя навигация делят одно состояние
// «открыта/закрыта». Держим его здесь, в самой внешней клиентской обёртке,
// чтобы страницы и секции ниже оставались серверными компонентами и
// продолжали ходить в БД.
//
// На /wok-builder мобильную нижнюю навигацию заменяет собственная
// закреплённая панель конструктора (цена, количество, «В корзину») —
// два ряда контролов внизу экрана одновременно съели бы слишком много
// места на компактном телефоне.
export function SiteShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const hasOwnMobileBar = pathname === "/wok-builder";

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      {/* Отступ снизу освобождает место под фиксированную мобильную навигацию */}
      <div className={cn("site-canvas md:pb-0", hasOwnMobileBar ? "pb-0" : "pb-20")}>{children}</div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {!hasOwnMobileBar && <MobileNav onCartClick={() => setCartOpen(true)} />}
    </>
  );
}

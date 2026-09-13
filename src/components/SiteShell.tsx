"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { MobileNav } from "@/components/MobileNav";

// Шапка, панель корзины и мобильная нижняя навигация делят одно состояние
// «открыта/закрыта». Держим его здесь, в самой внешней клиентской обёртке,
// чтобы страницы и секции ниже оставались серверными компонентами и
// продолжали ходить в БД.
export function SiteShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      {/* Отступ снизу освобождает место под фиксированную мобильную навигацию */}
      <div className="site-canvas pb-20 md:pb-0">{children}</div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav onCartClick={() => setCartOpen(true)} />
    </>
  );
}

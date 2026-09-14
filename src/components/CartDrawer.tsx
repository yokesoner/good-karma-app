"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart, cartSubtotalCents } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { BrandMark } from "@/components/BrandMark";

// Порог бесплатной доставки первой зоны. Здесь он захардкожен сознательно:
// настоящий порог зависит от зоны доставки, а зона — от адреса, которого до
// оформления заказа ещё нет. На этапе корзины показываем ориентир по
// ближней зоне, точный расчёт будет на чекауте, когда появится адрес.
const FREE_FROM_CENTS = 150000;

// Длительность должна совпадать с анимацией .cart-line-out в globals.css —
// строка убирается из состояния корзины только после того, как доиграет исчезновение.
const CART_LINE_EXIT_MS = 240;

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { lines, setQty, remove } = useCart();
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const subtotal = cartSubtotalCents(lines);
  const left = Math.max(0, FREE_FROM_CENTS - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_FROM_CENTS) * 100));

  function handleRemove(key: string) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      remove(key);
      return;
    }
    setRemovingKey(key);
    window.setTimeout(() => remove(key), CART_LINE_EXIT_MS);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    if (open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (open) returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-[#21151F]/35 backdrop-blur-[3px] transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-label="Корзина"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[480px] flex-col border-l border-white/60 bg-paper-2/94 shadow-[-30px_0_90px_-42px_rgba(41,21,36,.68)] backdrop-blur-2xl transition-[transform,visibility] duration-500 ease-out md:rounded-l-[38px] ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hair px-6 py-5">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[0.19em] text-cherry">Ваш выбор</span>
            <h2 className="mt-1 text-[21px] font-bold tracking-[-0.03em]">Корзина</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-s px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.115em] text-ink-2 hover:bg-hair-soft hover:text-ink"
          >
            Закрыть
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
            <span
              aria-hidden
              className="absolute right-0 top-[12%] text-[170px] font-bold leading-none text-plum/[0.035]"
            >
              福
            </span>
            <span className="relative mb-6 grid h-28 w-28 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-tint-sakura via-paper-2 to-tint-mint text-cherry shadow-[0_28px_60px_-35px_rgba(73,48,68,.6)]">
              <BrandMark className="h-14 w-14" />
            </span>
            <span className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-cherry">
              Пока здесь тихо
            </span>
            <p className="relative mt-3 max-w-[10ch] text-[27px] font-bold leading-[1.05] tracking-[-0.035em]">
              Добавим хорошей кармы?
            </p>
            <p className="relative mt-3 max-w-[30ch] text-[12.5px] leading-relaxed text-ink-3">
              Роллы, рамен, вок или тёплая пицца — выбирайте своё настроение.
            </p>
            <Link
              href="/menu"
              onClick={onClose}
              className="relative mt-6 rounded-full bg-btn px-7 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5"
            >
              Открыть меню →
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {lines.map((line) => (
              <div
                key={line.key}
                className={`flex gap-4 border-b border-hair-soft py-5 ${
                  removingKey === line.key ? "cart-line-out" : ""
                }`}
              >
                <div className="relative h-[76px] w-[76px] flex-none overflow-hidden rounded-[20px] border border-white/70 bg-paper-3 shadow-s">
                  {line.imageUrl && (
                    <Image src={line.imageUrl} alt="" fill sizes="68px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-tight">{line.name}</p>
                  {line.addons.length > 0 && (
                    <p className="mt-1 text-[11.5px] text-ink-3">
                      {line.addons.map((a) => a.name).join(" · ")}
                    </p>
                  )}
                  {line.wokConfig && (
                    <p className="mt-1 text-[11.5px] text-ink-3">
                      {line.wokConfig.baseName} · {line.wokConfig.proteinName} ·{" "}
                      {line.wokConfig.sauceName}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-hair">
                      <button
                        type="button"
                        aria-label="Уменьшить количество"
                        disabled={removingKey === line.key}
                        onClick={() => setQty(line.key, line.qty - 1)}
                        className="grid h-7 w-7 place-items-center text-ink-3 hover:text-ink disabled:opacity-40"
                      >
                        −
                      </button>
                      <span
                        key={line.qty}
                        className="cart-qty-pop min-w-5 text-center text-[13px] font-semibold"
                      >
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Увеличить количество"
                        disabled={removingKey === line.key}
                        onClick={() => setQty(line.key, line.qty + 1)}
                        className="grid h-7 w-7 place-items-center text-ink-3 hover:text-ink disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <span className="ml-auto text-[14px] font-bold">
                      {formatMoney(line.unitPriceCents * line.qty)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={removingKey === line.key}
                    onClick={() => handleRemove(line.key)}
                    className="mt-2 text-[11.5px] text-ink-3 hover:text-cherry disabled:opacity-40"
                  >
                    Убрать
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && (
          <div className="border-t border-hair px-6 py-5">
            <div className="mb-2 flex justify-between text-[12px] text-ink-2">
              <span>
                {left > 0 ? (
                  <>
                    До бесплатной доставки <b className="font-semibold text-ink">{formatMoney(left)}</b>
                  </>
                ) : (
                  <b className="font-semibold text-ink">Доставка бесплатно</b>
                )}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-hair">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-cherry transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 flex items-baseline justify-between overflow-hidden">
              <span className="text-[13px] text-ink-2">Итого</span>
              <span key={subtotal} className="wok-value-in text-[21px] font-bold">{formatMoney(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="mt-4 block w-full rounded-full bg-btn py-4 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-m"
            >
              Оформить заказ
            </Link>
            <p className="mt-3 text-center text-[11px] text-ink-3">
              Стоимость доставки рассчитаем на следующем шаге по адресу
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

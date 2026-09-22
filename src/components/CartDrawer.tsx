"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart, cartSubtotalCents } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { BrandMark } from "@/components/BrandMark";
import { getUnavailableProductIds } from "@/server/availability";
import { cn } from "@/lib/cn";

// Порог бесплатной доставки первой зоны. Здесь он захардкожен сознательно:
// настоящий порог зависит от зоны доставки, а зона — от адреса, которого до
// оформления заказа ещё нет. На этапе корзины показываем ориентир по
// ближней зоне, точный расчёт будет на чекауте, когда появится адрес.
const FREE_FROM_CENTS = 150000;

// Длительность должна совпадать с анимацией .cart-line-out в globals.css —
// строка убирается из состояния корзины только после того, как доиграет исчезновение.
const CART_LINE_EXIT_MS = 240;

// На сколько пикселей нужно потянуть шторку вниз, чтобы она закрылась.
const SWIPE_CLOSE_PX = 110;

// На телефоне корзина — нижняя шторка (открывается снизу, закрывается
// свайпом вниз за шапку, до кнопок легко дотянуться большим пальцем);
// на планшете и десктопе — прежняя правая панель.
export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const { lines, setQty, remove } = useCart();
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [dragY, setDragY] = useState<number | null>(null);
  const touchStartY = useRef(0);

  const unavailable = useMemo(() => new Set(unavailableIds), [unavailableIds]);
  const payable = lines.filter((line) => !unavailable.has(line.productId));
  const hasUnavailable = lines.length > payable.length;
  const subtotal = cartSubtotalCents(payable);
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

  // Корзина лежит в localStorage и могла быть собрана давно: при каждом
  // открытии сверяем с базой, не попали ли блюда (или их категории) на стоп.
  const productKey = [...new Set(lines.map((l) => l.productId))].sort().join(",");
  useEffect(() => {
    if (!open || !productKey) return;
    let cancelled = false;
    getUnavailableProductIds(productKey.split(","))
      .then((ids) => {
        if (!cancelled) setUnavailableIds(ids);
      })
      .catch(() => {
        // Нет связи — не блокируем корзину, сервер всё равно проверит при оформлении.
      });
    return () => {
      cancelled = true;
    };
  }, [open, productKey]);

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

  function onTouchStart(event: React.TouchEvent) {
    touchStartY.current = event.touches[0]?.clientY ?? 0;
    setDragY(0);
  }
  function onTouchMove(event: React.TouchEvent) {
    const y = event.touches[0]?.clientY ?? 0;
    setDragY(Math.max(0, y - touchStartY.current));
  }
  function onTouchEnd() {
    const shouldClose = (dragY ?? 0) > SWIPE_CLOSE_PX;
    setDragY(null);
    if (shouldClose) onClose();
  }

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
        style={dragY !== null ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        className={cn(
          "fixed z-50 flex flex-col transition-[transform,visibility] duration-500 ease-out",
          // На iOS Safari анимация transform на элементе с backdrop-filter
          // на время жеста отключает сам блюр — сквозь панель на секунду
          // проступает то, что под ней (мутный «грязный» фон, нечитаемый
          // текст). Поэтому во время свайпа снимаем backdrop-blur и держим
          // фон полностью непрозрачным (без альфы — контраст не зависит от
          // блюра); как только палец отпущен, блюр возвращается.
          dragY !== null ? "bg-paper-2" : "bg-paper-2/95 backdrop-blur-2xl",
          // телефон: нижняя шторка
          "inset-x-0 bottom-0 h-[88dvh] rounded-t-[28px] border-t border-white/60 shadow-[0_-30px_90px_-42px_rgba(41,21,36,.68)]",
          // планшет и десктоп: правая панель
          "md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-[100dvh] md:w-full md:max-w-[480px] md:rounded-l-[38px] md:rounded-tr-none md:border-l md:border-t-0 md:shadow-[-30px_0_90px_-42px_rgba(41,21,36,.68)]",
          open ? "visible translate-x-0 translate-y-0" : "invisible translate-y-full md:translate-x-full md:translate-y-0",
        )}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={() => setDragY(null)}
          className="touch-none border-b border-hair px-5 pb-3 pt-2 md:touch-auto md:px-6 md:py-5"
        >
          <span aria-hidden className="mx-auto mb-2 block h-1 w-10 rounded-full bg-ink-3/40 md:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.19em] text-cherry">Ваш выбор</span>
              <h2 className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] md:mt-1 md:text-[21px]">Корзина</h2>
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
        </div>

        {lines.length === 0 ? (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
            <span
              aria-hidden
              className="absolute right-0 top-[12%] text-[170px] font-bold leading-none text-plum/[0.035]"
            >
              福
            </span>
            <span className="relative mb-6 grid h-24 w-24 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-tint-sakura via-paper-2 to-tint-mint text-cherry shadow-[0_28px_60px_-35px_rgba(73,48,68,.6)] md:h-28 md:w-28">
              <BrandMark className="h-12 w-12 md:h-14 md:w-14" />
            </span>
            <span className="relative text-[9px] font-bold uppercase tracking-[0.2em] text-cherry">
              Пока здесь тихо
            </span>
            <p className="relative mt-3 max-w-[10ch] text-[25px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[27px]">
              Добавим хорошей кармы?
            </p>
            <p className="relative mt-3 max-w-[30ch] text-[12.5px] leading-relaxed text-ink-3">
              Роллы, рамен, вок или тёплая пицца — выбирайте своё настроение.
            </p>
            <Link
              href="/menu"
              onClick={onClose}
              className="relative mt-6 rounded-full bg-btn px-7 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition active:scale-95 hover:-translate-y-0.5"
            >
              Открыть меню →
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2 md:px-6 md:py-5">
            {hasUnavailable && (
              <p role="status" className="anim-pop mb-2 rounded-2xl bg-tint-gold px-4 py-3 text-[12.5px] leading-snug">
                Некоторые блюда сейчас недоступны и не попадут в заказ — уберите их или загляните позже.
              </p>
            )}
            {lines.map((line) => {
              const isUnavailable = unavailable.has(line.productId);
              return (
                <div
                  key={line.key}
                  className={`flex gap-3.5 border-b border-hair-soft py-4 md:gap-4 md:py-5 ${
                    removingKey === line.key ? "cart-line-out" : ""
                  }`}
                >
                  <div
                    className={cn(
                      "relative h-[64px] w-[64px] flex-none overflow-hidden rounded-[18px] border border-white/70 bg-paper-3 shadow-s md:h-[76px] md:w-[76px] md:rounded-[20px]",
                      isUnavailable && "is-unavailable",
                    )}
                  >
                    {line.imageUrl && (
                      <Image src={line.imageUrl} alt="" fill sizes="68px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold leading-tight">{line.name}</p>
                    {isUnavailable && (
                      <p className="mt-1 text-[11.5px] font-semibold text-cherry">Сейчас недоступно</p>
                    )}
                    {line.rewardId ? (
                      <p className="mt-1 text-[11.5px] font-semibold text-mint-deep">🎁 Подарок за баллы</p>
                    ) : (
                      <>
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
                      </>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      {line.rewardId ? (
                        <span className="text-[14px] font-bold text-mint-deep">Бесплатно</span>
                      ) : (
                        <>
                          <div className="flex items-center gap-0.5 rounded-full border border-hair">
                            <button
                              type="button"
                              aria-label="Уменьшить количество"
                              disabled={removingKey === line.key}
                              onClick={() => setQty(line.key, line.qty - 1)}
                              className="grid h-8 w-8 place-items-center text-[17px] text-ink-3 transition active:scale-90 hover:text-ink disabled:opacity-40"
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
                              className="grid h-8 w-8 place-items-center text-[17px] text-ink-3 transition active:scale-90 hover:text-ink disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <span className={cn("ml-auto text-[14px] font-bold", isUnavailable && "text-ink-3 line-through")}>
                            {formatMoney(line.unitPriceCents * line.qty)}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={removingKey === line.key}
                      onClick={() => handleRemove(line.key)}
                      className="mt-1.5 py-1 text-[11.5px] text-ink-3 hover:text-cherry disabled:opacity-40"
                    >
                      Убрать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lines.length > 0 && (
          <div className="border-t border-hair px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 md:px-6 md:py-5">
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

            <div className="mt-4 flex items-baseline justify-between overflow-hidden md:mt-5">
              <span className="text-[13px] text-ink-2">Итого</span>
              <span key={subtotal} className="wok-value-in text-[21px] font-bold">{formatMoney(subtotal)}</span>
            </div>
            {payable.length === 0 ? (
              <span
                aria-disabled
                className="mt-3 block w-full rounded-full bg-btn/40 py-4 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg"
              >
                Нечего оформлять
              </span>
            ) : (
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn-sheen mt-3 block w-full rounded-full bg-btn py-4 text-center text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-m md:mt-4"
              >
                Оформить заказ
              </Link>
            )}
            <p className="mt-2.5 text-center text-[11px] text-ink-3">
              Стоимость доставки рассчитаем на следующем шаге по адресу
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

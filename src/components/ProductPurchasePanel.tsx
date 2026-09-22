"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { formatMoney } from "@/lib/money";

type Addon = { id: string; name: string; priceCents: number; colorHex: string };

type Props = {
  productId: string;
  name: string;
  basePriceCents: number;
  imageUrl: string | null;
  addons: Addon[];
  /** Блюдо или вся его категория на стопе — купить нельзя. */
  unavailable?: boolean;
};

export function ProductPurchasePanel({
  productId,
  name,
  basePriceCents,
  imageUrl,
  addons,
  unavailable = false,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  // Портал доступен только в браузере: на сервере и при первой отрисовке
  // панель рендерится на месте, а после гидратации переезжает в body.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const add = useCart((s) => s.add);
  const showToast = useToast((s) => s.show);

  const chosen = useMemo(
    () => addons.filter((a) => selected.includes(a.id)),
    [addons, selected],
  );
  const unitPrice = basePriceCents + chosen.reduce((s, a) => s + a.priceCents, 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAdd = () => {
    if (unavailable) return;
    add(
      {
        productId,
        name,
        imageUrl,
        unitPriceCents: unitPrice,
        addons: chosen.map((a) => ({ id: a.id, name: a.name, priceCents: a.priceCents })),
      },
      qty,
    );
    showToast(`Добавлено в корзину: ${name}`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const stepper = (
    <div className="flex items-center gap-0.5 rounded-full border border-hair bg-paper/60 p-0.5 shadow-s md:gap-1 md:p-1">
      <button
        type="button"
        aria-label="Уменьшить количество"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="grid h-10 w-10 place-items-center rounded-full text-[18px] text-ink-3 transition active:scale-90 hover:bg-tint-sakura hover:text-ink md:h-9 md:w-9"
      >
        −
      </button>
      <span key={qty} className="cart-qty-pop inline-block min-w-6 text-center text-[14px] font-semibold">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Увеличить количество"
        onClick={() => setQty((q) => q + 1)}
        className="grid h-10 w-10 place-items-center rounded-full text-[18px] text-ink-3 transition active:scale-90 hover:bg-tint-sakura hover:text-ink md:h-9 md:w-9"
      >
        +
      </button>
    </div>
  );

  const addButton = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={unavailable}
      className="btn-sheen flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-btn px-6 text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 md:ml-auto md:flex-none md:px-8 md:py-4 md:hover:-translate-y-0.5 md:hover:shadow-m"
    >
      {unavailable ? (
        "Нет в наличии"
      ) : justAdded ? (
        <>
          Добавлено <Check className="h-4 w-4" strokeWidth={2.4} />
        </>
      ) : (
        `В корзину · ${formatMoney(unitPrice * qty)}`
      )}
    </button>
  );

  // Панель действий: на телефоне — закреплена внизу экрана над навигацией
  // (кнопка «В корзину» всегда под большим пальцем, не нужно скроллить до
  // конца страницы); на md и шире — обычный ряд под добавками.
  const actionBar = (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-hair bg-paper/90 px-4 py-2.5 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-[520px] items-center gap-3">
        {stepper}
        {addButton}
      </div>
    </div>
  );

  return (
    <div>
      {addons.length > 0 && (
        <div className="mb-5 rounded-[22px] border border-white/70 bg-paper/45 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.65)] md:mb-7 md:rounded-[24px] md:p-4">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Добавить к блюду
          </span>
          <div className="flex flex-wrap gap-2">
            {addons.map((a) => {
              const on = selected.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[12px] transition duration-300 active:scale-95 ${
                    on
                      ? "-translate-y-0.5 border-cherry/35 bg-tint-sakura text-ink shadow-s"
                      : "border-hair bg-paper-2/50 text-ink-2 hover:-translate-y-0.5 hover:border-cherry/25 hover:shadow-s"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: a.colorHex }}
                  />
                  {a.name}
                  <b className="text-[11.5px] font-bold text-cherry">
                    {on ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : `+${formatMoney(a.priceCents)}`}
                  </b>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {unavailable && (
        <p className="mb-4 rounded-2xl bg-tint-gold px-4 py-3 text-[13px] leading-snug">
          Сейчас недоступно — блюдо или вся категория временно на стопе. Загляните позже.
        </p>
      )}

      {/* Десктоп: цена за порцию + количество + кнопка в одном ряду */}
      <div className="hidden flex-wrap items-center gap-4 md:flex">
        <div className="overflow-hidden">
          <span className="block text-[8.5px] font-bold uppercase tracking-[0.16em] text-ink-3">Цена за порцию</span>
          <span key={unitPrice} className="wok-value-in mt-1 block text-[26px] font-bold tracking-[-0.04em]">
            {formatMoney(unitPrice)}
          </span>
        </div>
        {stepper}
        {addButton}
      </div>

      {/* Телефон: место под закреплённую панель + сама панель в body */}
      <div aria-hidden className="h-[4.5rem] md:hidden" />
      {mounted ? createPortal(actionBar, document.body) : null}
    </div>
  );
}

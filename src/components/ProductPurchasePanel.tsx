"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

type Addon = { id: string; name: string; priceCents: number; colorHex: string };

type Props = {
  productId: string;
  name: string;
  basePriceCents: number;
  imageUrl: string | null;
  addons: Addon[];
};

export function ProductPurchasePanel({
  productId,
  name,
  basePriceCents,
  imageUrl,
  addons,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const add = useCart((s) => s.add);

  const chosen = useMemo(
    () => addons.filter((a) => selected.includes(a.id)),
    [addons, selected],
  );
  const unitPrice = basePriceCents + chosen.reduce((s, a) => s + a.priceCents, 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAdd = () => {
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
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div>
      {addons.length > 0 && (
        <div className="mb-7 rounded-[24px] border border-white/70 bg-paper/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.65)]">
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
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[12px] transition duration-300 ${
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
                    {on ? "✓" : `+${a.priceCents / 100}`}
                  </b>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="block text-[8.5px] font-bold uppercase tracking-[0.16em] text-ink-3">Цена за порцию</span>
          <span className="mt-1 block text-[26px] font-bold tracking-[-0.04em]">{formatMoney(unitPrice)}</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-hair bg-paper/60 p-1 shadow-s">
          <button
            type="button"
            aria-label="Уменьшить количество"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition hover:bg-tint-sakura hover:text-ink"
          >
            −
          </button>
          <span className="min-w-6 text-center text-[14px] font-semibold">{qty}</span>
          <button
            type="button"
            aria-label="Увеличить количество"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition hover:bg-tint-sakura hover:text-ink"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="ml-auto rounded-full bg-btn px-8 py-4 text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:shadow-m"
        >
          {justAdded ? "Добавлено ✓" : `В корзину · ${formatMoney(unitPrice * qty)}`}
        </button>
      </div>
    </div>
  );
}

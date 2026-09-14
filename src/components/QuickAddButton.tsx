"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

export function QuickAddButton({
  productId,
  name,
  priceCents,
  imageUrl,
  disabled,
}: {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  disabled?: boolean;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Добавить ${name} в корзину`}
      onClick={() => {
        add({ productId, name, imageUrl, unitPriceCents: priceCents, addons: [] });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hair bg-paper-2 text-lg shadow-s transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:bg-btn hover:text-btn-fg active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
    >
      <span key={added ? "on" : "off"} className="icon-pop inline-block">
        {added ? "✓" : "+"}
      </span>
    </button>
  );
}

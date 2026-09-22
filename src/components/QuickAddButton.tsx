"use client";

import { useState } from "react";
import { Check, Plus } from "@/components/icons";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

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
  const showToast = useToast((s) => s.show);
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={disabled ? `${name} — нет в наличии` : `Добавить ${name} в корзину`}
      onClick={() => {
        add({ productId, name, imageUrl, unitPriceCents: priceCents, addons: [] });
        showToast(`Добавлено в корзину: ${name}`);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className={`ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-s transition duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 md:h-10 md:w-10 md:hover:-translate-y-0.5 md:hover:border-transparent md:hover:bg-btn md:hover:text-btn-fg ${
        added ? "border-transparent bg-btn text-btn-fg" : "border-hair bg-paper-2"
      }`}
    >
      <span key={added ? "on" : "off"} className="icon-pop inline-flex text-[17px]">
        {added ? <Check strokeWidth={2.2} /> : <Plus strokeWidth={2} />}
      </span>
    </button>
  );
}

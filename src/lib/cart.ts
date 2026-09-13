"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Строка корзины. Одно и то же блюдо с разным набором добавок — это разные
// строки, поэтому ключ строки составной, а не просто productId.
export type CartWokConfig = {
  baseId: string;
  baseName: string;
  proteinId: string;
  proteinName: string;
  sauceId: string;
  sauceName: string;
};

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPriceCents: number; // цена блюда вместе с выбранными добавками
  qty: number;
  addons: { id: string; name: string; priceCents: number }[];
  wokConfig?: CartWokConfig | null;
};

type CartState = {
  lines: CartLine[];
  promoCode: string | null;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setPromo: (code: string | null) => void;
  clear: () => void;
};

// variantKey различает строки, которые не сводятся к набору добавок —
// например, разные сборки вока с одним и тем же (скрытым) productId.
export const lineKey = (productId: string, addonIds: string[], variantKey?: string) =>
  [productId, ...[...addonIds].sort(), ...(variantKey ? [variantKey] : [])].join("|");

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promoCode: null,
      add: (line, qty = 1) =>
        set((state) => {
          const key = lineKey(
            line.productId,
            line.addons.map((a) => a.id),
            line.wokConfig
              ? `${line.wokConfig.baseId}-${line.wokConfig.proteinId}-${line.wokConfig.sauceId}`
              : undefined,
          );
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, qty: l.qty + qty } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key, qty }] };
        }),
      setQty: (key, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
        })),
      remove: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setPromo: (code) => set({ promoCode: code ? code.toUpperCase() : null }),
      clear: () => set({ lines: [], promoCode: null }),
    }),
    {
      // Тот же ключ, что в прототипе — если гость уже собирал корзину
      // на старой версии сайта, она не потеряется при переезде.
      name: "gk_cart",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Формат строки корзины изменился (добавки, цены в копейках).
      // Старые записи прототипа просто отбрасываем, вместо того чтобы
      // пытаться их сконвертировать и показать гостю неверные цены.
      migrate: () => ({ lines: [], promoCode: null }) as Partial<CartState>,
    },
  ),
);

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.qty, 0);

export const cartSubtotalCents = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);

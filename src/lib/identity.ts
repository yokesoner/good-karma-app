"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// «Личность» гостя без пароля и без SMS-кода — тот же уровень доверия,
// что placeOrder уже применяет при оформлении заказа (src/server/actions.ts):
// ввёл номер телефона — считаешься этим пользователем. Храним userId
// (cuid), а не голый телефон, чтобы личность нельзя было подобрать
// перебором номеров с чужого устройства.
export type Identity = { userId: string; name: string; phone: string } | null;

type IdentityState = {
  identity: Identity;
  setIdentity: (identity: Identity) => void;
  clear: () => void;
};

export const useIdentity = create<IdentityState>()(
  persist(
    (set) => ({
      identity: null,
      setIdentity: (identity) => set({ identity }),
      clear: () => set({ identity: null }),
    }),
    {
      name: "gk_identity",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

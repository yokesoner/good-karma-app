"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// После SMS-подтверждения личность по-прежнему хранится локально. Это
// защищает вход с нового устройства, но не заменяет серверную сессию с
// истечением или возможностью «выйти со всех устройств».
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

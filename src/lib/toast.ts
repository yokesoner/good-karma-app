"use client";

import { create } from "zustand";

export type Toast = { id: number; text: string };

type ToastState = {
  toasts: Toast[];
  show: (text: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;
const TOAST_DURATION_MS = 2500;

// Лёгкое всплывающее уведомление про «добавлено в корзину» — не
// сохраняется между сессиями (в отличие от useCart), просто очередь
// сообщений с автоудалением.
export const useToast = create<ToastState>()((set) => ({
  toasts: [],
  show: (text) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, text }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, TOAST_DURATION_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

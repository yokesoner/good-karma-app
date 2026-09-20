"use client";

import { useToast } from "@/lib/toast";

export function ToastHost() {
  const toasts = useToast((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="wok-toast-in pointer-events-auto max-w-[92vw] rounded-full bg-[#3A2338] px-5 py-3 text-center text-[12.5px] font-semibold text-[#FFF8F2] shadow-l"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

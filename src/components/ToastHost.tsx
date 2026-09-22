"use client";

import { useToast } from "@/lib/toast";

// На телефоне внизу уже стоят нижняя навигация и плавающая корзина, поэтому
// уведомление показываем сверху, под шапкой (там оно никого не закрывает);
// на планшете и десктопе — по-прежнему внизу по центру.
export function ToastHost() {
  const toasts = useToast((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(3.75rem+env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4 md:bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:top-auto"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="anim-pop pointer-events-auto max-w-[92vw] rounded-full bg-[#3A2338] px-5 py-3 text-center text-[12.5px] font-semibold text-[#FFF8F2] shadow-l"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

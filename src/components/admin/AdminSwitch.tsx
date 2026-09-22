"use client";

import { cn } from "@/lib/cn";

// Ползунок «вкл/выкл» для стоп-листа: включён — блюдо в продаже, выключен —
// на стопе. Сама зона нажатия шире видимого ползунка (before:-inset-2), чтобы
// попадать большим пальцем без прицеливания.
export function AdminSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 before:absolute before:-inset-2 before:content-[''] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "bg-mint-deep" : "bg-ink-3/45",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-paper-2 shadow-[0_2px_6px_rgba(35,20,32,.35)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

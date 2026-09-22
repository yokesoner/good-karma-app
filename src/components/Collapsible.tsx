"use client";

import { useId, useState } from "react";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Сворачиваемый блок для покупательских страниц — тот же приём
 * (grid-template-rows 0fr→1fr), что уже проверен в админском аккордеоне
 * меню (AdminMenuManager), только с открытым API: сюда передаётся готовая
 * шапка (summary), а не фиксированный набор полей. Используется там, где
 * контент длинный, но не обязателен глазу постоянно (этапы заказа, история
 * заказов, адреса) — раньше эти блоки просто всегда были развёрнуты и
 * растягивали страницу на телефоне.
 */
export function Collapsible({
  summary,
  defaultOpen = false,
  children,
  className,
  contentClassName,
}: {
  summary: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 py-1 text-left"
      >
        {summary}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className={cn("min-h-0 overflow-hidden", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

/**
 * «Показать ещё N» — для однородных списков/сеток (заказы, подарки),
 * где полностью прятать всё за один клик неудобно: первые items видны
 * сразу, остальные — по кнопке. В отличие от Collapsible не сворачивает
 * назад после раскрытия (в длинных списках это ожидаемое поведение — как
 * «Показать ещё» у Яндекса и большинства лент).
 */
export function ShowMore<T>({
  items,
  initialCount,
  render,
  moreLabel = (n: number) => `Показать ещё ${n}`,
  className,
}: {
  items: T[];
  initialCount: number;
  render: (item: T, index: number) => React.ReactNode;
  moreLabel?: (hiddenCount: number) => string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialCount);
  const hiddenCount = items.length - visible.length;

  return (
    <>
      {visible.map((item, index) => render(item, index))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 text-[12px] font-semibold text-plum transition hover:underline",
            className,
          )}
        >
          {moreLabel(hiddenCount)}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
}

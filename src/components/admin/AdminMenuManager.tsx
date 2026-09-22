"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminSwitch } from "@/components/admin/AdminSwitch";
import { ChevronDown, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { useToast } from "@/lib/toast";
import { setCategoryAvailability, setProductAvailability } from "@/server/adminMenu";

export type MenuProduct = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  isStopList: boolean;
  isHidden: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  isStopList: boolean;
  products: MenuProduct[];
};

// Меню для админа с телефона: категории — аккордеоны, у каждой категории и
// каждого блюда ползунок «в продаже / на стопе». Строки компактные (фото
// 44 px), а не громоздкие карточки — при необходимости страницу можно
// увеличить жестом. Переключатели срабатывают сразу: интерфейс меняется
// мгновенно, а если сервер отказал — откатывается с сообщением.
export function AdminMenuManager({ categories }: { categories: MenuCategory[] }) {
  const [items, setItems] = useState(categories);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const showToast = useToast((state) => state.show);

  // После router.refresh() сервер присылает свежие данные — синхронизируемся.
  useEffect(() => setItems(categories), [categories]);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!normalizedQuery) return items;
    return items
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => product.name.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((category) => category.products.length > 0);
  }, [items, normalizedQuery]);

  const totalProducts = items.reduce((sum, category) => sum + category.products.length, 0);
  const stoppedProducts = items.reduce(
    (sum, category) =>
      sum + category.products.filter((product) => product.isStopList || category.isStopList).length,
    0,
  );

  function toggleOpen(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleProduct(categoryId: string, product: MenuProduct, available: boolean) {
    const apply = (stop: boolean) =>
      setItems((current) =>
        current.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                products: category.products.map((p) => (p.id === product.id ? { ...p, isStopList: stop } : p)),
              }
            : category,
        ),
      );
    apply(!available);
    const result = await setProductAvailability(product.id, available).catch(() => null);
    if (!result?.ok) {
      apply(available);
      showToast(result?.error ?? "Нет связи с сервером — попробуйте ещё раз");
      return;
    }
    showToast(available ? `«${product.name}» снова в продаже` : `«${product.name}» на стопе`);
  }

  async function toggleCategory(category: MenuCategory, available: boolean) {
    const apply = (stop: boolean) =>
      setItems((current) => current.map((c) => (c.id === category.id ? { ...c, isStopList: stop } : c)));
    apply(!available);
    const result = await setCategoryAvailability(category.id, available).catch(() => null);
    if (!result?.ok) {
      apply(available);
      showToast(result?.error ?? "Нет связи с сервером — попробуйте ещё раз");
      return;
    }
    showToast(available ? `Категория «${category.name}» снова в продаже` : `Категория «${category.name}» на стопе`);
  }

  const allOpen = visible.length > 0 && visible.every((category) => openIds.has(category.id) || normalizedQuery);

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти блюдо"
          aria-label="Найти блюдо"
          className="w-full rounded-full border border-hair bg-paper-2 py-3 pl-11 pr-4 text-[14px] outline-none transition focus:border-plum"
        />
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[12px] text-ink-3">
        <span>
          {totalProducts} блюд
          {stoppedProducts > 0 && (
            <>
              {" · "}
              <b className="font-semibold text-cherry">{stoppedProducts} на стопе</b>
            </>
          )}
        </span>
        {!normalizedQuery && visible.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenIds(allOpen ? new Set() : new Set(visible.map((category) => category.id)))}
            className="py-1 font-semibold text-plum"
          >
            {allOpen ? "Свернуть все" : "Развернуть все"}
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {visible.map((category) => {
          // При поиске раскрываем всё найденное — не заставляем тапать ещё раз.
          const isOpen = Boolean(normalizedQuery) || openIds.has(category.id);
          const stopped = category.products.filter((product) => product.isStopList).length;
          return (
            <section
              key={category.id}
              className={cn(
                "overflow-hidden rounded-[22px] border border-hair bg-paper-2 transition-opacity duration-300",
                category.isStopList && "border-cherry/25",
              )}
            >
              <div className="flex items-center gap-2 pr-4">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleOpen(category.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left active:bg-paper-3"
                >
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300", isOpen && "rotate-180")} />
                  <span className="min-w-0">
                    <span className={cn("block truncate text-[15px] font-bold", category.isStopList && "text-ink-3")}>
                      {category.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-ink-3">
                      {category.products.length} блюд
                      {category.isStopList ? (
                        <b className="font-semibold text-cherry"> · вся категория на стопе</b>
                      ) : (
                        stopped > 0 && <b className="font-semibold text-cherry"> · {stopped} на стопе</b>
                      )}
                    </span>
                  </span>
                </button>
                <AdminSwitch
                  checked={!category.isStopList}
                  label={`${category.name}: вся категория в продаже`}
                  onChange={(available) => void toggleCategory(category, available)}
                />
              </div>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className={cn("min-h-0 overflow-hidden transition-[visibility] duration-300", !isOpen && "invisible")}>
                  {category.products.length === 0 && (
                    <p className="border-t border-hair-soft px-4 py-4 text-[13px] text-ink-3">В категории пока нет блюд.</p>
                  )}
                  {category.products.map((product) => {
                    const effectivelyStopped = product.isStopList || category.isStopList;
                    return (
                      <div key={product.id} className="flex items-center gap-3 border-t border-hair-soft py-2.5 pl-4 pr-4">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl active:opacity-70"
                        >
                          <span
                            role="img"
                            aria-label={product.name}
                            className={cn(
                              "h-11 w-11 shrink-0 rounded-xl bg-paper-3 bg-cover bg-center transition-[filter,opacity] duration-300",
                              effectivelyStopped && "opacity-50 grayscale",
                            )}
                            style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-[14px] font-semibold", effectivelyStopped && "text-ink-3")}>
                              {product.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-ink-3">
                              {formatMoney(product.priceCents)}
                              {product.isHidden && " · скрыт из каталога"}
                              {category.isStopList && !product.isStopList && " · категория на стопе"}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3/60" />
                        </Link>
                        <AdminSwitch
                          checked={!product.isStopList}
                          label={`${product.name}: в продаже`}
                          onChange={(available) => void toggleProduct(category.id, product, available)}
                          className={cn(category.isStopList && "opacity-60")}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
        {visible.length === 0 && (
          <p className="rounded-[22px] border border-hair bg-paper-2 p-8 text-center text-sm text-ink-2">
            {normalizedQuery ? "Ничего не нашли." : "Каталог пуст."}
          </p>
        )}
      </div>
    </div>
  );
}

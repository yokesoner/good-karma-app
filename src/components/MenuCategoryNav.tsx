"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Item = { id: string; name: string; stopped?: boolean };

// Липкая лента категорий для телефона: как в приложениях доставки, тап по
// названию прокручивает к разделу, а при обычной прокрутке подсвечивается
// категория, которая сейчас на экране. Заменяет большую ленту круглых
// превью, которой на телефоне приходилось долго листать. На md и шире
// скрыта — там остаётся прежняя «Куда сегодня?».
//
// «Какой раздел сейчас читают» считаем по положению заголовков при
// прокрутке (а не IntersectionObserver): так результат однозначен и при
// быстрой прокрутке, и при переходе по якорю.
export function MenuCategoryNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const railRef = useRef<HTMLDivElement>(null);
  // Пока идёт плавная прокрутка после тапа, не даём scroll-обработчику
  // перебивать выбранную пользователем категорию промежуточными значениями.
  const lockUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < lockUntil.current) return;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 150) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  // Активная «пилюля» всегда остаётся видимой в ленте.
  useEffect(() => {
    const rail = railRef.current;
    const chip = rail?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(active)}"]`);
    if (!rail || !chip) return;
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.clientWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className="sticky top-[57px] z-30 -mx-5 border-b border-hair bg-paper/90 px-5 backdrop-blur-xl md:hidden">
      <div ref={railRef} className="snap-row relative flex gap-2 overflow-x-auto py-2.5" role="tablist" aria-label="Разделы меню">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-chip={item.id}
            role="tab"
            aria-selected={active === item.id}
            onClick={() => {
              setActive(item.id);
              lockUntil.current = Date.now() + 900;
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-[background-color,color,transform] duration-200 active:scale-95",
              active === item.id ? "bg-btn text-btn-fg shadow-s" : "bg-paper-3/70 text-ink-2",
              item.stopped && active !== item.id && "opacity-55",
            )}
          >
            {item.name}
          </a>
        ))}
      </div>
    </div>
  );
}

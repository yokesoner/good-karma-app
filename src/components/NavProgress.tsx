"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Тонкая полоска сверху экрана при переходе между страницами. На телефоне
// тап по ссылке без видимой реакции ощущается как «сайт завис», пока
// сервер собирает следующую страницу; полоска даёт мгновенный отклик.
// Слушаем клики по внутренним ссылкам (и обычным <Link>, и Link из
// next-view-transitions — оба рендерят <a>), завершаем при смене пути.
export function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);
  const lastPath = useRef(pathname);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      clearTimers();
      setVisible(true);
      setProgress(0.12);
      timers.current.push(window.setTimeout(() => setProgress(0.45), 120));
      timers.current.push(window.setTimeout(() => setProgress(0.7), 700));
      timers.current.push(window.setTimeout(() => setProgress(0.85), 2000));
      // Подстраховка: если переход не случился (ошибка сети), полоска не
      // должна висеть вечно.
      timers.current.push(
        window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 12000),
      );
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    clearTimers();
    setProgress(1);
    timers.current.push(window.setTimeout(() => setVisible(false), 260));
    timers.current.push(window.setTimeout(() => setProgress(0), 520));
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2.5px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 220ms ease" }}
    >
      <div
        className="nav-progress h-full w-full bg-gradient-to-r from-gold via-cherry to-plum"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

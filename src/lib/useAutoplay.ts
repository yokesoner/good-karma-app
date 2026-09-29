"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Когда самодвижущемуся блоку (карусель акций, слайдер главного экрана)
 * можно листать самому. Стоит, пока:
 *  — курсор мыши над блоком (touch-наведения не бывает, его не считаем);
 *  — фокус клавиатуры внутри блока (WCAG 2.2.2: не уводить контент из-под фокуса);
 *  — вкладка скрыта или блок вне экрана — анимировать некому;
 *  — пользователь нажал «пауза».
 * При prefers-reduced-motion автолистания нет вовсе; до монтирования
 * считаем движение нежелательным — сервер не знает настроек пользователя,
 * а лишний автозапуск хуже его отсутствия.
 */
export function useAutoplay(rootRef: RefObject<HTMLElement>, { enabled }: { enabled: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let inView = false;
    const update = () => setOnScreen(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        update();
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [rootRef]);

  const autoplay = enabled && !reducedMotion && !userPaused;
  const running = autoplay && !hovered && !focused && onScreen;

  /** Обработчики для корневого элемента блока. */
  const bind = {
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: (event: React.FocusEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
    },
  };

  return { reducedMotion, autoplay, running, userPaused, setUserPaused, bind };
}

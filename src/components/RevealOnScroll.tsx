"use client";

import { useEffect } from "react";

/**
 * Один общий наблюдатель на весь сайт: любой элемент с атрибутом
 * data-reveal плавно всплывает, когда попадает в экран. В отличие от
 * <Reveal> не требует клиентской обёртки вокруг каждой карточки — атрибут
 * можно ставить прямо в серверных компонентах (ProductCard, секции).
 *
 *   data-reveal            — всплытие снизу (по умолчанию)
 *   data-reveal="fade"     — только проявление
 *   data-reveal="scale"    — проявление с лёгким увеличением
 *   style={{ "--reveal-delay": "80ms" }} — задержка для «лесенки» в сетке
 *
 * Стили — в globals.css. Класс .reveal-ready на <html> включает скрытое
 * начальное состояние только после гидратации: без JS весь контент виден.
 * Новые элементы (после перехода на другую страницу, подгрузка в
 * Suspense) подхватывает MutationObserver.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      // Срабатывает, как только верхний край элемента зашёл в экран —
      // а не когда виден заметный процент высоты. Иначе высокие секции на
      // телефоне оставались бы пустыми, пока не покажутся наполовину.
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    const watch = (el: Element) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    };
    const scan = (scope: ParentNode) => {
      scope.querySelectorAll("[data-reveal]:not(.is-in)").forEach(watch);
    };

    scan(document);
    document.documentElement.classList.add("reveal-ready");

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-reveal]")) watch(node);
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}

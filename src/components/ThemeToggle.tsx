"use client";

import { useEffect, useState } from "react";

// Тема выставляется инлайн-скриптом ещё до отрисовки (ThemeScript), поэтому
// сервер не знает, какая она — отсюда mounted-флаг: до гидратации рисуем
// нейтральную заглушку, иначе React ругается на расхождение разметки.
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("gk_theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Переключить тему"
      className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition hover:bg-hair-soft hover:text-ink"
    >
      <span className="sr-only">
        {mounted ? (theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему") : "Тема"}
      </span>
      {mounted && theme === "dark" ? (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-[19px] w-[19px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.8v2M12 19.2v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2.8 12h2M19.2 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4" />
        </svg>
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-[19px] w-[19px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <path d="M20.2 14.4A8.6 8.6 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z" />
        </svg>
      )}
    </button>
  );
}

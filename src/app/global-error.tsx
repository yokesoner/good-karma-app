"use client";

import { SystemPage, systemPrimaryAction } from "@/components/SystemPage";
import { CAFE_PHONE, telHref } from "@/lib/contacts";
import "./globals.css";

// Последний рубеж — ошибка в самом корневом layout (шапка, SiteShell).
// Next заменяет им весь документ, поэтому здесь свои <html>/<body> и нет
// шапки: полагаться на то, что только что упало, нельзя.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <SystemPage
          variant="crack"
          eyebrow="Гуд Карма"
          title="Сайт дал трещину"
          description={
            <p>
              Попробуйте обновить страницу через минуту. Заказ можно сделать по
              телефону <a className="font-semibold text-ink underline decoration-gold underline-offset-4" href={telHref(CAFE_PHONE)}>{CAFE_PHONE}</a>.
            </p>
          }
          actions={
            <button type="button" onClick={reset} className={systemPrimaryAction}>
              Попробовать снова
            </button>
          }
          footnote={error.digest ? <>Код ошибки: <code className="font-mono">{error.digest}</code></> : undefined}
        />
      </body>
    </html>
  );
}

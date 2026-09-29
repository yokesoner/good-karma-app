"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  SystemPage,
  systemPrimaryAction,
  systemSecondaryAction,
} from "@/components/SystemPage";
import { CAFE_PHONE, telHref } from "@/lib/contacts";

// Граница ошибок для всех страниц под корневым layout: шапка, корзина и
// мобильная навигация остаются рабочими, заменяется только содержимое.
// Самый частый сценарий — база недоступна на динамической странице
// (оформление, профиль, заказ); статические страницы в этот момент
// продолжают отдаваться из кеша последней удачной сборки.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SystemPage
      variant="crack"
      eyebrow="Сбой на нашей стороне"
      title="Что-то дало трещину"
      description={
        <p>
          Обычно помогает попробовать ещё раз через минуту. Если хочется
          заказать прямо сейчас — позвоните, примем заказ по телефону.
        </p>
      }
      actions={
        <>
          <button type="button" onClick={reset} className={systemPrimaryAction}>
            Попробовать снова
          </button>
          <a href={telHref(CAFE_PHONE)} className={systemSecondaryAction}>
            {CAFE_PHONE}
          </a>
          <Link href="/" className={systemSecondaryAction}>
            На главную
          </Link>
        </>
      }
      // digest — идентификатор ошибки в серверных логах Next; по нему
      // проще всего найти причину, если гость пришлёт скриншот.
      footnote={error.digest ? <>Код ошибки: <code className="font-mono">{error.digest}</code></> : undefined}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  SystemPage,
  systemPrimaryAction,
  systemSecondaryAction,
} from "@/components/SystemPage";

export const metadata: Metadata = {
  title: "Страница не найдена — Гуд Карма",
  robots: { index: false },
};

// Срабатывает и на несуществующий адрес, и на notFound() из страниц
// (удалённый товар, чужой номер заказа) — поэтому текст не обвиняет гостя
// в опечатке, а сразу ведёт туда, где точно всё на месте.
export default function NotFound() {
  return (
    <SystemPage
      variant="missing"
      eyebrow="Ошибка 404"
      title="Эта страница потерялась"
      description={
        <p>
          Возможно, ссылка устарела или блюдо убрали из меню. Всё остальное на
          своих местах — меню, акции и конструктор вока.
        </p>
      }
      actions={
        <>
          <Link href="/menu" className={systemPrimaryAction}>
            Открыть меню
          </Link>
          <Link href="/" className={systemSecondaryAction}>
            На главную
          </Link>
        </>
      }
    />
  );
}

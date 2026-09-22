"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

// Переключатели «в продаже / на стопе» в админском меню. «Доступно» =
// НЕ в стоп-листе — так ползунок читается естественно: включён — гости
// могут заказать, выключен — блюдо (или вся категория) на стопе.
//
// Стоп-лист срочный: гость мог открыть страницу минуту назад, поэтому
// сбрасываем кэш всего сайта, а не отдельных путей. Сам заказ всё равно
// проверяется на сервере по живой базе (pricing.ts), кэш страниц тут только
// про то, чтобы витрина показала «нет в наличии» сразу.
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function setProductAvailability(productId: string, available: boolean) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(productId);
  if (!parsedId.success || typeof available !== "boolean") {
    return { ok: false as const, error: "Некорректный товар" };
  }
  try {
    await db.product.update({ where: { id: parsedId.data }, data: { isStopList: !available } });
    refreshSite();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось изменить статус блюда" };
  }
}

export async function setCategoryAvailability(categoryId: string, available: boolean) {
  await requireAdmin();
  const parsedId = z.string().min(1).max(40).safeParse(categoryId);
  if (!parsedId.success || typeof available !== "boolean") {
    return { ok: false as const, error: "Некорректная категория" };
  }
  try {
    await db.category.update({ where: { id: parsedId.data }, data: { isStopList: !available } });
    refreshSite();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось изменить статус категории" };
  }
}

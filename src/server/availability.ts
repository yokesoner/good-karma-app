"use server";

import { z } from "zod";
import { db } from "@/lib/db";

// Какие из блюд в корзине прямо сейчас на стопе — само блюдо или вся его
// категория. Корзина живёт в localStorage и может быть собрана час назад:
// без этой проверки гость увидел бы блюдо в корзине, а при оформлении оно
// молча выпало бы из заказа (pricing.ts пропускает такие строки).
// Публичное действие — отдаёт только id блюд без личных данных.
export async function getUnavailableProductIds(productIds: string[]): Promise<string[]> {
  const parsed = z.array(z.string().min(1).max(60)).max(100).safeParse(productIds);
  if (!parsed.success || parsed.data.length === 0) return [];
  const rows = await db.product.findMany({
    where: {
      id: { in: parsed.data },
      OR: [{ isStopList: true }, { category: { isStopList: true } }],
    },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

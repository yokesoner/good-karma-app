import { db } from "@/lib/db";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orderFlow";

// Счётчики для вкладок «Активные / Выполнены / Отменены / Все» и красного
// бейджа «новых заказов» на нижней панели админки. Один запрос вместо
// четырёх count(): заказов у одного кафе немного, группировка по статусу
// дешёвая. Модуль без "use server" — его вызывают только серверные
// компоненты (layout и страница заказов), а не браузер.
export async function getAdminOrderCounts() {
  const rows = await db.order.groupBy({ by: ["status"], _count: { _all: true } });
  const byStatus = new Map(rows.map((row) => [row.status, row._count._all]));
  const count = (status: string) => byStatus.get(status as never) ?? 0;

  return {
    new: count("NEW"),
    active: ACTIVE_ORDER_STATUSES.reduce((sum, status) => sum + count(status), 0),
    done: count("DONE"),
    cancelled: count("CANCELLED"),
    all: rows.reduce((sum, row) => sum + row._count._all, 0),
  };
}

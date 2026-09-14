"use server";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const UpdateAdminOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  paymentStatus: z.nativeEnum(PaymentStatus),
});

export type AdminOrderStatusInput = z.infer<typeof UpdateAdminOrderSchema>;

export async function updateAdminOrder(id: string, input: unknown) {
  await requireAdmin();
  const parsedId = z.string().cuid().safeParse(id);
  const parsed = UpdateAdminOrderSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return { ok: false as const, error: "Проверьте статусы заказа и оплаты" };
  }

  try {
    const order = await db.order.update({
      where: { id: parsedId.data },
      data: parsed.data,
      select: { number: true },
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsedId.data}`);
    revalidatePath(`/order/${order.number}`);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false as const, error: "Заказ не найден" };
    }
    return { ok: false as const, error: "Не удалось сохранить статусы" };
  }
}

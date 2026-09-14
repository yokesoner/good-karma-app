"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

const DeliveryZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  maxDistanceKm: z.number().positive().max(20),
  priceCents: z.number().int().min(0).max(10_000_000),
  freeFromCents: z.number().int().min(0).max(100_000_000),
});

export type AdminDeliveryZoneInput = z.infer<typeof DeliveryZoneSchema>;

async function orderingError(candidate: AdminDeliveryZoneInput, originalZone?: number) {
  const existing = await db.deliveryZone.findMany({
    where: { zone: { not: originalZone ?? candidate.zone } },
    select: { zone: true, maxDistanceKm: true },
  });
  const zones = [
    ...existing.map((item) => ({ zone: item.zone, maxDistanceKm: Number(item.maxDistanceKm) })),
    { zone: candidate.zone, maxDistanceKm: candidate.maxDistanceKm },
  ].sort((a, b) => a.zone - b.zone);
  for (let index = 1; index < zones.length; index += 1) {
    if (zones[index]!.maxDistanceKm <= zones[index - 1]!.maxDistanceKm) {
      return "Радиус каждой следующей зоны должен быть больше предыдущей";
    }
  }
  return null;
}

function refreshDeliveryPages() {
  revalidatePath("/checkout");
  revalidatePath("/admin/delivery-zones");
}

export async function createAdminDeliveryZone(input: unknown) {
  await requireAdmin();
  const parsed = DeliveryZoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  const orderIssue = await orderingError(parsed.data);
  if (orderIssue) return { ok: false as const, error: orderIssue };
  try {
    await db.deliveryZone.create({ data: parsed.data });
    refreshDeliveryPages();
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "Зона с таким номером уже существует" };
    }
    return { ok: false as const, error: "Не удалось создать зону" };
  }
}

export async function updateAdminDeliveryZone(zone: string, input: unknown) {
  await requireAdmin();
  const original = z.coerce.number().int().min(1).max(5).safeParse(zone);
  const parsed = DeliveryZoneSchema.safeParse(input);
  if (!original.success || !parsed.success || parsed.data.zone !== original.data) {
    return { ok: false as const, error: "Номер зоны нельзя менять" };
  }
  const orderIssue = await orderingError(parsed.data, original.data);
  if (orderIssue) return { ok: false as const, error: orderIssue };
  try {
    await db.deliveryZone.update({ where: { zone: original.data }, data: parsed.data });
    refreshDeliveryPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось сохранить зону" };
  }
}

export async function deleteAdminDeliveryZone(zone: string) {
  await requireAdmin();
  const parsed = z.coerce.number().int().min(1).max(5).safeParse(zone);
  if (!parsed.success) return { ok: false as const, error: "Некорректный номер зоны" };
  try {
    await db.deliveryZone.delete({ where: { zone: parsed.data } });
    refreshDeliveryPages();
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Не удалось удалить зону" };
  }
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminDeliveryZoneForm } from "@/components/admin/AdminDeliveryZoneForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование зоны — админка Гуд Карма" };
export default async function EditAdminDeliveryZonePage({ params }: { params: { zone: string } }) { const zoneNumber = Number(params.zone); if (!Number.isInteger(zoneNumber)) notFound(); const zone = await db.deliveryZone.findUnique({ where: { zone: zoneNumber } }); if (!zone) notFound(); return <div><Link href="/admin/delivery-zones" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все зоны</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Зона {zone.zone}</h1><AdminDeliveryZoneForm initial={{ zone: zone.zone, maxDistanceKm: Number(zone.maxDistanceKm), priceCents: zone.priceCents, freeFromCents: zone.freeFromCents }} /></div>; }

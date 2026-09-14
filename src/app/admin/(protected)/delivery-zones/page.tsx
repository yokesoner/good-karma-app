import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { deleteAdminDeliveryZone } from "@/server/adminDeliveryZones";

export const metadata: Metadata = { title: "Зоны доставки — админка Гуд Карма" };
export default async function AdminDeliveryZonesPage() {
  const zones = await db.deliveryZone.findMany({ orderBy: { zone: "asc" } });
  return <div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Боевые данные</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Зоны доставки</h1><p className="mt-2 text-sm text-ink-2">Изменения влияют на новые заказы сразу</p></div>{zones.length < 5 && <Link href="/admin/delivery-zones/new" className="rounded-full bg-plum-deep px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить зону</Link>}</div><div className="mt-6 rounded-2xl border border-gold/40 bg-tint-gold px-5 py-4 text-sm leading-relaxed">Радиусы должны строго возрастать по номеру зоны. Сервер проверяет порядок перед сохранением.</div><div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">{zones.map((zone) => <article key={zone.zone} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[100px_1fr_1fr_170px] md:items-center"><h2 className="font-semibold">Зона {zone.zone}</h2><p className="text-sm text-ink-2">до {Number(zone.maxDistanceKm).toFixed(1)} км</p><p className="text-sm text-ink-2">{formatMoney(zone.priceCents)} · бесплатно от {formatMoney(zone.freeFromCents)}</p><div className="flex items-center justify-end gap-4"><Link href={`/admin/delivery-zones/${zone.zone}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link><AdminDeleteButton identifier={String(zone.zone)} label={`зону ${zone.zone}`} action={deleteAdminDeliveryZone} /></div></article>)}{zones.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Зон доставки пока нет.</p>}</div></div>;
}

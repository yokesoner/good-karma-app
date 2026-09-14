import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeliveryZoneForm } from "@/components/admin/AdminDeliveryZoneForm";

export const metadata: Metadata = { title: "Новая зона — админка Гуд Карма" };
export default function NewAdminDeliveryZonePage() { return <div><Link href="/admin/delivery-zones" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Все зоны</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">Новая зона доставки</h1><AdminDeliveryZoneForm /></div>; }

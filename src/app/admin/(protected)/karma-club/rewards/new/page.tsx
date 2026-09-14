import type { Metadata } from "next";
import Link from "next/link";
import { AdminKarmaRewardForm } from "@/components/admin/AdminKarmaRewardForm";

export const metadata: Metadata = { title: "Новая награда — админка Гуд Карма" };
export default function NewAdminKarmaRewardPage() { return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">Новая награда</h1><AdminKarmaRewardForm /></div>; }

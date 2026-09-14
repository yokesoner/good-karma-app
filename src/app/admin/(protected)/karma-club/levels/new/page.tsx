import type { Metadata } from "next";
import Link from "next/link";
import { AdminKarmaLevelForm } from "@/components/admin/AdminKarmaLevelForm";

export const metadata: Metadata = { title: "Новый уровень — админка Гуд Карма" };
export default function NewAdminKarmaLevelPage() { return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">Новый уровень</h1><AdminKarmaLevelForm /></div>; }

import type { Metadata } from "next";
import Link from "next/link";
import { AdminWokSauceForm } from "@/components/admin/AdminWokSauceForm";

export const metadata: Metadata = { title: "Новый соус — админка Гуд Карма" };
export default function NewAdminWokSaucePage() { return <div><Link href="/admin/wok-builder" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Конструктор вока</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">Новый соус</h1><AdminWokSauceForm /></div>; }

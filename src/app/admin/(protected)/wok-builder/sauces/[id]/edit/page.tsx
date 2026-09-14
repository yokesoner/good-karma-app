import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminWokSauceForm } from "@/components/admin/AdminWokSauceForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование соуса — админка Гуд Карма" };
export default async function EditAdminWokSaucePage({ params }: { params: { id: string } }) { const sauce = await db.wokSauce.findUnique({ where: { id: params.id } }); if (!sauce) notFound(); return <div><Link href="/admin/wok-builder" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Конструктор вока</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">{sauce.name}</h1><AdminWokSauceForm initial={sauce} /></div>; }

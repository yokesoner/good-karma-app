import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminKarmaLevelForm } from "@/components/admin/AdminKarmaLevelForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Редактирование уровня — админка Гуд Карма" };
export default async function EditAdminKarmaLevelPage({ params }: { params: { key: string } }) { const level = await db.karmaLevel.findUnique({ where: { key: params.key } }); if (!level) notFound(); return <div><Link href="/admin/karma-club" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Karma Club</Link><h1 className="mb-8 mt-4 text-4xl font-semibold tracking-tight">{level.name}</h1><AdminKarmaLevelForm initial={level} /></div>; }

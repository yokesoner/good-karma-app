import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminWokIngredientForm } from "@/components/admin/AdminWokIngredientForm";
import { db } from "@/lib/db";
import { createAdminWokBase, updateAdminWokBase } from "@/server/adminWokIngredients";

export const metadata: Metadata = { title: "Редактирование основы — админка Гуд Карма" };
export default async function EditAdminWokBasePage({ params }: { params: { id: string } }) { const base = await db.wokBase.findUnique({ where: { id: params.id } }); if (!base) notFound(); return <div><Link href="/admin/wok-builder" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Конструктор вока</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">{base.name}</h1><AdminWokIngredientForm initial={base} idLabel="ID основы" backHref="/admin/wok-builder" createAction={createAdminWokBase} updateAction={updateAdminWokBase} /></div>; }

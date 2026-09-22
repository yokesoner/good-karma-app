import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminWokIngredientForm } from "@/components/admin/AdminWokIngredientForm";
import { db } from "@/lib/db";
import { createAdminWokProtein, updateAdminWokProtein } from "@/server/adminWokIngredients";

export const metadata: Metadata = { title: "Редактирование начинки — админка Гуд Карма" };
export default async function EditAdminWokProteinPage({ params }: { params: { id: string } }) { const protein = await db.wokProtein.findUnique({ where: { id: params.id } }); if (!protein) notFound(); return <div><Link href="/admin/wok-builder" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Конструктор вока</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">{protein.name}</h1><AdminWokIngredientForm initial={protein} idLabel="ID начинки" backHref="/admin/wok-builder" createAction={createAdminWokProtein} updateAction={updateAdminWokProtein} /></div>; }

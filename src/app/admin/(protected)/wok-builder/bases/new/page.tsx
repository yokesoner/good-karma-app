import type { Metadata } from "next";
import Link from "next/link";
import { AdminWokIngredientForm } from "@/components/admin/AdminWokIngredientForm";
import { createAdminWokBase, updateAdminWokBase } from "@/server/adminWokIngredients";

export const metadata: Metadata = { title: "Новая основа — админка Гуд Карма" };
export default function NewAdminWokBasePage() { return <div><Link href="/admin/wok-builder" className="text-xs font-bold uppercase tracking-[0.1em] text-ink-2 hover:text-ink">← Конструктор вока</Link><h1 className="mb-8 mt-4 text-[28px] font-semibold tracking-tight md:text-4xl">Новая основа</h1><AdminWokIngredientForm idLabel="ID основы" backHref="/admin/wok-builder" createAction={createAdminWokBase} updateAction={updateAdminWokBase} /></div>; }

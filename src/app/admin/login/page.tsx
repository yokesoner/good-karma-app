import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = { title: "Вход в админку — Гуд Карма" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/products");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tint-ivory via-tint-lavender to-tint-blush px-5 py-12">
      <section className="w-full max-w-md rounded-[32px] border border-hair bg-paper/90 p-7 shadow-l md:p-10">
        <BrandMark />
        <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Управление каталогом</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Вход в админку</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">Доступ только для созданных администраторов.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}

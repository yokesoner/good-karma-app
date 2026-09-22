import type { Metadata } from "next";
import Link from "next/link";
import { AdminDeleteButton } from "@/components/admin/AdminDeleteButton";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import {
  deleteAdminWokBase,
  deleteAdminWokProtein,
  deleteAdminWokSauce,
} from "@/server/adminWokIngredients";

export const metadata: Metadata = { title: "Конструктор вока — админка Гуд Карма" };

export default async function AdminWokBuilderPage() {
  const [bases, proteins, sauces] = await Promise.all([
    db.wokBase.findMany({ orderBy: { extraCents: "asc" } }),
    db.wokProtein.findMany({ orderBy: { extraCents: "asc" } }),
    db.wokSauce.findMany({ orderBy: { extraCents: "asc" } }),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">Noodle Lab</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight md:text-4xl">Конструктор вока</h1>
        <p className="mt-2 text-sm text-ink-2">
          Ингредиенты читаются напрямую конструктором на сайте и расчётом цены — правки применяются сразу.
          Если для нового ID нет фотографии в реестре ассетов, на сайте покажется нейтральная иконка вместо фото.
        </p>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold">Основы</h2><p className="mt-1 text-sm text-ink-2">Лапша, рис и другие базы</p></div>
          <Link href="/admin/wok-builder/bases/new" className="rounded-full bg-plum-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить основу</Link>
        </div>
        <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
          {bases.map((base) => (
            <article key={base.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_160px_170px] md:items-center">
              <div><h3 className="font-semibold">{base.name}</h3><p className="mt-1 text-xs text-ink-3">{base.id}</p></div>
              <p className="text-sm text-ink-2">+{formatMoney(base.extraCents)}</p>
              <div className="flex items-center justify-end gap-4">
                <Link href={`/admin/wok-builder/bases/${base.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link>
                <AdminDeleteButton identifier={base.id} label={base.name} action={deleteAdminWokBase} />
              </div>
            </article>
          ))}
          {bases.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Основ пока нет.</p>}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold">Начинки</h2><p className="mt-1 text-sm text-ink-2">Мясо, морепродукты, тофу</p></div>
          <Link href="/admin/wok-builder/proteins/new" className="rounded-full bg-plum-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить начинку</Link>
        </div>
        <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
          {proteins.map((protein) => (
            <article key={protein.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_160px_170px] md:items-center">
              <div><h3 className="font-semibold">{protein.name}</h3><p className="mt-1 text-xs text-ink-3">{protein.id}</p></div>
              <p className="text-sm text-ink-2">+{formatMoney(protein.extraCents)}</p>
              <div className="flex items-center justify-end gap-4">
                <Link href={`/admin/wok-builder/proteins/${protein.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link>
                <AdminDeleteButton identifier={protein.id} label={protein.name} action={deleteAdminWokProtein} />
              </div>
            </article>
          ))}
          {proteins.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Начинок пока нет.</p>}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold">Соусы</h2><p className="mt-1 text-sm text-ink-2">Тонировка маски по цвету соуса</p></div>
          <Link href="/admin/wok-builder/sauces/new" className="rounded-full bg-plum-deep px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-btn-fg">Добавить соус</Link>
        </div>
        <div className="mt-5 overflow-hidden rounded-[28px] border border-hair bg-paper-2">
          {sauces.map((sauce) => (
            <article key={sauce.id} className="grid gap-3 border-b border-hair p-5 last:border-b-0 md:grid-cols-[1fr_100px_160px_170px] md:items-center">
              <div><h3 className="font-semibold">{sauce.name}</h3><p className="mt-1 text-xs text-ink-3">{sauce.id}</p></div>
              <span className="h-6 w-6 rounded-full border border-hair" style={{ backgroundColor: sauce.colorHex }} aria-hidden />
              <p className="text-sm text-ink-2">+{formatMoney(sauce.extraCents)}</p>
              <div className="flex items-center justify-end gap-4">
                <Link href={`/admin/wok-builder/sauces/${sauce.id}/edit`} className="text-[10px] font-bold uppercase tracking-[0.1em] text-plum hover:underline">Изменить</Link>
                <AdminDeleteButton identifier={sauce.id} label={sauce.name} action={deleteAdminWokSauce} />
              </div>
            </article>
          ))}
          {sauces.length === 0 && <p className="p-10 text-center text-sm text-ink-2">Соусов пока нет.</p>}
        </div>
      </section>
    </div>
  );
}

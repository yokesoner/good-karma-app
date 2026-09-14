import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { BrandMark } from "@/components/BrandMark";
import { getCurrentAdmin } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-hair bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-wrap items-center justify-between gap-5 px-5 py-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link href="/admin/products" aria-label="Товары — админка Good Karma"><BrandMark /></Link>
            <nav className="hidden sm:block">
              <Link href="/admin/products" className="text-xs font-bold uppercase tracking-[0.12em] text-ink-2 hover:text-ink">Товары</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-2 md:inline">{admin.name}</span>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-wrap px-5 py-8 md:px-8 md:py-12">{children}</main>
    </div>
  );
}

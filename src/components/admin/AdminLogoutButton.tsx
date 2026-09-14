"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/server/adminAuth";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await logoutAdmin();
        router.replace("/admin/login");
        router.refresh();
      })}
      className="rounded-full border border-hair px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition hover:border-plum"
    >
      {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminProduct } from "@/server/adminProducts";

export function AdminDeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Удалить «${name}»? Это действие нельзя отменить.`)) return;
          startTransition(async () => {
            const result = await deleteAdminProduct(id);
            if (!result.ok) setError(result.error);
            else router.refresh();
          });
        }}
        className="text-[10px] font-bold uppercase tracking-[0.1em] text-cherry hover:underline disabled:opacity-50"
      >
        {pending ? "Удаляем…" : "Удалить"}
      </button>
      {error && <p className="mt-1 max-w-[220px] text-xs text-cherry">{error}</p>}
    </div>
  );
}

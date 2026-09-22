"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DeleteResult = { ok: true } | { ok: false; error: string };

export function AdminDeleteButton({
  identifier,
  label,
  action,
  redirectTo,
  className,
}: {
  identifier: string;
  label: string;
  action: (identifier: string) => Promise<DeleteResult>;
  /** Куда перейти после удаления (для кнопки на странице самого объекта). */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className={className ?? "text-right"}>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Удалить «${label}»? Это действие нельзя отменить.`)) return;
          setError("");
          startTransition(async () => {
            const result = await action(identifier);
            if (!result.ok) setError(result.error);
            else if (redirectTo) router.replace(redirectTo);
            else router.refresh();
          });
        }}
        className="text-[10px] font-bold uppercase tracking-[0.1em] text-cherry hover:underline disabled:opacity-50"
      >
        {pending ? "Удаляем…" : "Удалить"}
      </button>
      {error && <p role="alert" className="mt-1 max-w-[260px] text-xs text-cherry">{error}</p>}
    </div>
  );
}

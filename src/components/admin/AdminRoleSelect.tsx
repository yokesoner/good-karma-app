"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAdminRole } from "@/server/adminTeam";

export function AdminRoleSelect({ id, role }: { id: string; role: "OWNER" | "STAFF" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="text-right">
      <select
        defaultValue={role}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          setError("");
          startTransition(async () => {
            const result = await updateAdminRole(id, next);
            if (!result.ok) {
              setError(result.error);
              event.target.value = role;
              return;
            }
            router.refresh();
          });
        }}
        className="rounded-full border border-hair bg-paper-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] disabled:opacity-50"
      >
        <option value="STAFF">Сотрудник</option>
        <option value="OWNER">Владелец</option>
      </select>
      {error && <p role="alert" className="mt-1 max-w-[220px] text-xs text-cherry">{error}</p>}
    </div>
  );
}

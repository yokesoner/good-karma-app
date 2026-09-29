"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveHeroSlide, restoreDefaultHeroSlides } from "@/server/adminHeroSlides";

/** Стрелки «выше/ниже» в списке слайдов главного экрана. */
export function AdminHeroSlideMove({ id, isFirst, isLast }: { id: string; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const move = (direction: "up" | "down") =>
    startTransition(async () => {
      setError("");
      const result = await moveHeroSlide(id, direction);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });

  const button = "grid h-9 w-9 place-items-center rounded-full border border-hair text-[15px] transition hover:border-plum disabled:opacity-30";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Выше" disabled={pending || isFirst} onClick={() => move("up")} className={button}>↑</button>
      <button type="button" aria-label="Ниже" disabled={pending || isLast} onClick={() => move("down")} className={button}>↓</button>
      {error && <span role="alert" className="text-xs text-cherry">{error}</span>}
    </div>
  );
}

/** Для пустого списка: вернуть исходные слайды одним нажатием. */
export function AdminHeroSlideRestore() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await restoreDefaultHeroSlides();
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
        className="min-h-11 rounded-full border border-hair px-5 text-xs font-bold uppercase tracking-[0.1em] hover:border-plum disabled:opacity-50"
      >
        {pending ? "Добавляем…" : "Добавить исходные слайды"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-cherry">{error}</p>}
    </div>
  );
}

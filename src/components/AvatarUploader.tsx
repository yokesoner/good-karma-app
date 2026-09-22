"use client";

import { ChangeEvent, useRef, useState } from "react";
import { removeCustomerAvatar, uploadCustomerAvatar } from "@/server/customerUploads";
import { Camera } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Аватарка в профиле. Загружает и сразу сохраняет (без «подтвердите» —
 * выбрал фото → готово), поверх — тот же паттерн, что у AdminImageUploader,
 * только через клиентский customerUploads.ts (папка "avatars" зашита в
 * действии, folder клиент не выбирает).
 *
 * Оформление — золотое кольцо (тот же приём, что в Instagram/Stories, но
 * в палитре сайта) плюс маленький значок камеры в углу вместо тёмной
 * плашки на всё фото при наведении: значок виден всегда, отдельной кнопкой,
 * не перекрывает само фото.
 */
export function AvatarUploader({
  avatarUrl,
  name,
  onChanged,
  variant = "light",
  size = "md",
}: {
  avatarUrl: string | null;
  name: string;
  onChanged: (url: string | null) => void;
  /** "light" — на светлой подложке страницы, "dark" — на тёмной карте Karma Pass. */
  variant?: "light" | "dark";
  size?: "md" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadCustomerAvatar(formData);
      if (!result.ok) throw new Error(result.error);
      onChanged(result.avatarUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить фото");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const result = await removeCustomerAvatar();
      if (!result.ok) throw new Error(result.error);
      onChanged(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось убрать фото");
    } finally {
      setBusy(false);
    }
  }

  const initial = name.trim().charAt(0).toUpperCase() || "К";
  const dark = variant === "dark";
  const dim = size === "lg" ? "h-20 w-20" : "h-16 w-16";
  const badgeDim = size === "lg" ? "h-8 w-8" : "h-7 w-7";

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0">
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-gold via-cherry/70 to-plum-deep p-[2.5px] shadow-[0_10px_26px_-14px_rgba(58,35,56,.55)]",
            busy && "animate-pulse",
          )}
        >
          <div className={cn("rounded-full p-[2px]", dark ? "bg-[#3A2338]" : "bg-paper")}>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              aria-label={avatarUrl ? "Сменить фото профиля" : "Добавить фото профиля"}
              className={cn(
                "grid place-items-center overflow-hidden rounded-full transition active:scale-95 disabled:opacity-60",
                dim,
                dark ? "bg-white/10" : "bg-tint-sakura",
              )}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- аватарки пользователей вне next/image (произвольные размеры, диск сервера)
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className={cn("text-[20px] font-bold", dark ? "text-white/85" : "text-cherry")}>{initial}</span>
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label={avatarUrl ? "Сменить фото профиля" : "Добавить фото профиля"}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full border-2 shadow-s transition active:scale-90 disabled:opacity-60",
            badgeDim,
            dark ? "border-[#3A2338] bg-[#F7D9A6] text-[#3A2338]" : "border-paper bg-plum-deep text-white",
          )}
        >
          <Camera className="h-[13px] w-[13px]" />
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} className="sr-only" />
      <div className="min-w-0 text-[11px]">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn("font-semibold underline underline-offset-2 disabled:opacity-50", dark ? "text-white decoration-white/40" : "text-ink decoration-hair")}
        >
          {busy ? "Загрузка…" : avatarUrl ? "Сменить фото" : "Добавить фото"}
        </button>
        {avatarUrl && (
          <button type="button" disabled={busy} onClick={remove} className={cn("ml-3 disabled:opacity-50", dark ? "text-white/60 hover:text-white" : "text-ink-3 hover:text-cherry")}>
            Убрать
          </button>
        )}
        {error && <p role="alert" className={cn("mt-1", dark ? "text-[#FFD8D8]" : "text-cherry")}>{error}</p>}
      </div>
    </div>
  );
}

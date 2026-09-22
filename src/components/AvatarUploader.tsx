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
  const dim = size === "lg" ? "h-16 w-16" : "h-14 w-14";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label={avatarUrl ? "Сменить фото профиля" : "Добавить фото профиля"}
        className={cn(
          "group relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 shadow-[0_10px_26px_-14px_rgba(0,0,0,.5)] transition active:scale-95 disabled:opacity-60",
          dim,
          dark ? "border-white/70 bg-white/15" : "border-gold/30 bg-tint-sakura",
        )}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- аватарки пользователей вне next/image (произвольные размеры, диск сервера)
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className={cn("text-[18px] font-bold", dark ? "text-white/85" : "text-cherry")}>{initial}</span>
        )}
        <span className="absolute inset-0 hidden place-items-center bg-black/45 group-hover:grid">
          <Camera className="h-5 w-5 text-white" />
        </span>
      </button>
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

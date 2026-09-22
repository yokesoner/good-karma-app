"use client";

import { ChangeEvent, useRef, useState } from "react";
import { uploadProductImage } from "@/server/adminUploads";

export function AdminImageUploader({
  onUploaded,
  folder = "products",
}: {
  onUploaded: (url: string, alt: string) => void;
  folder?: "products" | "promotions" | "categories" | "wok" | "levels" | "banners";
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
      formData.set("folder", folder);
      const result = await uploadProductImage(formData);
      if (!result.ok) throw new Error(result.error);
      onUploaded(result.publicUrl, file.name.replace(/\.[^.]+$/, ""));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить изображение");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={upload}
        className="sr-only"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-plum/30 bg-paper-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition hover:border-plum disabled:opacity-50"
      >
        {busy ? "Загрузка…" : "Загрузить картинку"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-cherry">{error}</p>}
    </div>
  );
}

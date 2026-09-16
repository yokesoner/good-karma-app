"use client";

import { ChangeEvent, useRef, useState } from "react";
import { createProductImageUpload } from "@/server/adminUploads";

export function AdminImageUploader({
  onUploaded,
  folder = "products",
}: {
  onUploaded: (url: string, alt: string) => void;
  folder?: "products" | "promotions" | "categories" | "wok";
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
      const prepared = await createProductImageUpload({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        folder,
      });
      if (!prepared.ok) throw new Error(prepared.error);
      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error(`S3 вернул ${response.status}`);
      onUploaded(prepared.publicUrl, file.name.replace(/\.[^.]+$/, ""));
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
        {busy ? "Загрузка…" : "Загрузить в S3"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-cherry">{error}</p>}
    </div>
  );
}

"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { normalizeUploadedImage, saveUploadedFile, type UploadFolder } from "@/lib/uploadStorage";

const MAX_SIZE_BYTES = 12 * 1024 * 1024;

const MetaSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  // Только имя папки — не даём вызывающему коду задавать произвольный путь,
  // чтобы не расползались случайные префиксы в public/uploads.
  folder: z.enum(["products", "promotions", "categories", "wok", "levels", "banners"]).default("products"),
});

// Загрузка в один шаг: клиент шлёт сам файл в FormData, сервер пишет его на
// диск (public/uploads) и сразу отдаёт публичный URL. Раньше здесь было два
// шага — presigned PUT URL в S3, потом отдельный PUT с браузера напрямую в
// хранилище; на своём диске это лишнее, файл можно записать сразу.
export async function uploadProductImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "Файл не найден" };
  }
  if (file.size <= 0) {
    return { ok: false as const, error: "Пустой файл" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false as const, error: "Файл должен быть не больше 12 МБ" };
  }

  const parsed = MetaSchema.safeParse({
    contentType: file.type,
    folder: formData.get("folder") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Некорректный файл" };
  }

  try {
    const { buffer, extension } = await normalizeUploadedImage(Buffer.from(await file.arrayBuffer()));
    const fileName = `${randomUUID()}.${extension}`;
    const { publicUrl } = await saveUploadedFile({
      folder: parsed.data.folder as UploadFolder,
      fileName,
      buffer,
    });
    return { ok: true as const, publicUrl };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Не удалось сохранить изображение",
    };
  }
}

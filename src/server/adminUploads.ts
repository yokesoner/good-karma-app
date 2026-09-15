"use server";

import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { getS3Config } from "@/lib/s3";

const UploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  size: z.number().int().positive().max(12 * 1024 * 1024, "Файл должен быть не больше 12 МБ"),
  // Только имя папки в бакете — не даём вызывающему коду задавать произвольный
  // путь, чтобы не расползались случайные префиксы в хранилище.
  folder: z.enum(["products", "promotions"]).default("products"),
});

const extensionByType: Record<z.infer<typeof UploadSchema>["contentType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function createProductImageUpload(input: unknown) {
  await requireAdmin();
  const parsed = UploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Некорректный файл" };
  }

  try {
    const { client, bucket, publicUrlBase } = getS3Config();
    const now = new Date();
    const key = `${parsed.data.folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extensionByType[parsed.data.contentType]}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: parsed.data.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 10 * 60 });
    const publicUrl = `${publicUrlBase}/${key.split("/").map(encodeURIComponent).join("/")}`;
    return { ok: true as const, uploadUrl, publicUrl, key };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Не удалось подготовить загрузку",
    };
  }
}

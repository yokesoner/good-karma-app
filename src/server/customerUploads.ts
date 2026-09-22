"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentCustomerId } from "@/lib/customerAuth";
import { saveUploadedFile } from "@/lib/uploadStorage";

const MAX_SIZE_BYTES = 6 * 1024 * 1024;

const MetaSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
});

const extensionByType: Record<z.infer<typeof MetaSchema>["contentType"], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Отдельный (не admin) загрузчик: папка жёстко "avatars" — клиент не может
// подставить произвольный folder, как в админской uploadProductImage. Сразу
// же и сохраняем ссылку в User.avatarUrl — отдельного шага "подтвердить"
// нет, выбрал фото → загрузилось → стало аватаркой.
export async function uploadCustomerAvatar(formData: FormData) {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Сессия истекла. Войдите заново" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Файл не найден" };
  if (file.size <= 0) return { ok: false as const, error: "Пустой файл" };
  if (file.size > MAX_SIZE_BYTES) return { ok: false as const, error: "Файл должен быть не больше 6 МБ" };

  const parsed = MetaSchema.safeParse({ contentType: file.type });
  if (!parsed.success) return { ok: false as const, error: "Поддерживаются JPG, PNG, WEBP, AVIF" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${userId}-${randomUUID()}.${extensionByType[parsed.data.contentType]}`;
    const { publicUrl } = await saveUploadedFile({ folder: "avatars", fileName, buffer });
    await db.user.update({ where: { id: userId }, data: { avatarUrl: publicUrl } });
    return { ok: true as const, avatarUrl: publicUrl };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Не удалось сохранить фото" };
  }
}

export async function removeCustomerAvatar() {
  const userId = await getCurrentCustomerId();
  if (!userId) return { ok: false as const, error: "Сессия истекла. Войдите заново" };
  await db.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  return { ok: true as const };
}

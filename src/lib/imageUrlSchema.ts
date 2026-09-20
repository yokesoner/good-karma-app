import { z } from "zod";

// Единая проверка "это похоже на URL нашей картинки": либо файл, только что
// загруженный через админку (/uploads/…, см. src/lib/uploadStorage.ts),
// либо бандловый ассет (/assets/…), либо внешняя HTTPS-ссылка (на случай,
// если админ вставит готовый URL руками). Раньше в разных местах стоял
// голый z.string().url() или regex без /uploads/ — оба ломались на
// собственных относительных путях после перехода с S3 (абсолютных URL) на
// локальное хранилище картинок.
export const IMAGE_URL_MAX_LENGTH = 500;

export function isAllowedImageUrl(value: string): boolean {
  return value.startsWith("/uploads/") || value.startsWith("/assets/") || /^https:\/\//i.test(value);
}

export function imageUrlSchema(options: { maxLength?: number; requiredMessage?: string } = {}) {
  const { maxLength = IMAGE_URL_MAX_LENGTH, requiredMessage } = options;
  let schema = z.string().trim().max(maxLength);
  if (requiredMessage) schema = schema.min(1, requiredMessage);
  return schema.refine(isAllowedImageUrl, "Допустим путь /uploads/…, /assets/… или HTTPS-ссылка");
}

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Картинки из админки хранятся прямо на диске сервера — не в S3. Сайт живёт
// на одном VPS, отдельное хранилище было бы лишней инфраструктурой. Папка не
// в git и не бэкапится вместе с кодом — при переносе сервера её переносят
// так же, как базу.
//
// В проде путь задаёт UPLOADS_DIR — абсолютный каталог ВНЕ сборки
// (например /var/www/good-karma-uploads). Раньше файлы писались в
// process.cwd()/public/uploads, а standalone-сервер делает chdir в
// .next/standalone: загрузки оказывались внутри сборки и стирались при
// каждом `npm run build`. Отдаёт их маршрут app/uploads/[...path] (или
// Nginx alias перед ним) — сразу после загрузки, без перезапуска: список
// файлов public/ Next читает только при старте. Без UPLOADS_DIR (локальная
// разработка) — прежний public/uploads.
export const UPLOADS_DIR = process.env.UPLOADS_DIR?.trim()
  ? path.resolve(process.env.UPLOADS_DIR.trim())
  : path.join(process.cwd(), "public", "uploads");

// Сторона, больше которой хранить нет смысла: самые широкие места сайта
// (слайдер, баннеры) не просят больше 1920px.
const MAX_UPLOAD_SIDE = 2000;

/**
 * Приводит загруженную картинку к разумному виду до записи на диск: фото с
 * телефона весит 5–10 МБ и 4000+ px, а на сайте нужно в разы меньше — каждый
 * такой оригинал занимал бы диск и заставлял sharp в next/image декодировать
 * его заново на каждый размер. Заодно поворачиваем по EXIF (иначе фото
 * «лежит на боку») и выкидываем метаданные — в EXIF телефона бывают GPS-
 * координаты. Если sharp не смог прочитать файл — это не картинка, что бы ни
 * заявлял браузер в contentType.
 */
export async function normalizeUploadedImage(buffer: Buffer): Promise<{ buffer: Buffer; extension: "webp" }> {
  try {
    const output = await sharp(buffer, { animated: true })
      .rotate()
      .resize({ width: MAX_UPLOAD_SIDE, height: MAX_UPLOAD_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    return { buffer: output, extension: "webp" };
  } catch {
    throw new Error("Не удалось прочитать изображение — попробуйте другой файл");
  }
}

export type UploadFolder ="products" | "promotions" | "categories" | "wok" | "levels" | "banners" | "avatars";

export async function saveUploadedFile(params: {
  folder: UploadFolder;
  fileName: string;
  buffer: Buffer;
}): Promise<{ publicUrl: string }> {
  const { folder, fileName, buffer } = params;
  const now = new Date();
  const dir = path.join(UPLOADS_DIR, folder, String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buffer);

  const publicPath = [
    "uploads",
    folder,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    fileName,
  ]
    .map(encodeURIComponent)
    .join("/");
  return { publicUrl: `/${publicPath}` };
}

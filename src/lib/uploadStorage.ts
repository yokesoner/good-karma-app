import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Картинки из админки хранятся прямо на диске сервера, в public/uploads —
// не в S3. Сайт живёт на одном VPS (не масштабируется на несколько
// серверов), поэтому отдельное хранилище было бы лишней инфраструктурой;
// next start сам отдаёт всё из public/ как статику, Nginx в DEPLOYMENT.md
// ничего дополнительно настраивать не должен. Важно: эта папка не в git
// (см. .gitignore) и не бэкапится вместе с кодом при деплое — при переносе
// на новый сервер нужно переносить public/uploads так же, как базу.
export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type UploadFolder = "products" | "promotions" | "categories" | "wok" | "levels";

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

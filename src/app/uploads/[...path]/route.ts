import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_DIR } from "@/lib/uploadStorage";

// Отдаёт картинки, загруженные через админку и профиль, из UPLOADS_DIR.
// Нужен потому, что загрузки живут вне public/ (см. uploadStorage.ts), а
// public/ Next в проде индексирует только при старте — файл, загруженный
// после запуска, иначе отдавал бы 404 до перезапуска. В проде перед этим
// маршрутом удобно поставить Nginx alias — тогда до Node запрос не дойдёт.
export const dynamic = "force-dynamic";

// Только то, что вообще принимают загрузчики (adminUploads/customerUploads).
// SVG сознательно нет: с того же домена это был бы вектор XSS.
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const root = path.resolve(UPLOADS_DIR);
  const target = path.resolve(root, ...params.path.map((segment) => decodeURIComponent(segment)));
  // Никаких выходов за пределы каталога загрузок (../, абсолютные пути).
  if (!target.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });

  const type = CONTENT_TYPES[path.extname(target).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  try {
    const info = await stat(target);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const body = await readFile(target);
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        // Имена файлов — случайные UUID, содержимое по адресу не меняется.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

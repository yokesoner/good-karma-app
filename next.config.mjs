// next/image отклоняет домен, которого нет в remotePatterns, — товары,
// акции и баннер уже могут хранить presigned-загруженные S3-картинки
// (см. src/server/adminUploads.ts), поэтому домен бакета нужно разрешить
// сразу, как только он появится в .env, а не когда кто-то словит ошибку
// рендера в проде. Без S3_PUBLIC_URL_BASE ничего не меняется.
const s3RemotePattern = (() => {
  const base = process.env.S3_PUBLIC_URL_BASE;
  if (!base) return null;
  try {
    const url = new URL(base);
    return { protocol: url.protocol.replace(":", ""), hostname: url.hostname };
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Временно — пока не переехали на собственную фотосъёмку в S3-совместимом
    // хранилище (см. README, часть «Фаза 5»). Тогда этот блок заменится на
    // remotePatterns с вашим CDN-доменом.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(s3RemotePattern ? [s3RemotePattern] : []),
    ],
  },
};

export default nextConfig;

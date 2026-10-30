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
    // Файлы из public/ Next отдаёт с max-age=0, поэтому оптимизированная
    // копия по умолчанию «протухает» через 60 секунд и sharp пережимает её
    // заново — на VPS это постоянная нагрузка на CPU и память. Ассеты не
    // меняются без пересборки, загрузки из админки — новые UUID-имена,
    // так что месяц кэша безопасен.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Самый широкий исходник — ~1800px; ступени 2048/3840 по умолчанию
    // не давали чётче, а только плодили лишние копии в .next/cache/images.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  experimental: {
    serverActions: {
      // Загрузка картинок идёт server action'ом, а его лимит по умолчанию —
      // 1 МБ: фото с телефона (3–8 МБ) отклонялось раньше, чем доходило до
      // проверки в adminUploads (12 МБ). Держим в паре с client_max_body_size
      // в Nginx (DEPLOYMENT.md).
      bodySizeLimit: "13mb",
    },
  },
  // Самодостаточная сборка в .next/standalone — на VPS не нужно тащить
  // node_modules целиком, только public/, .next/static и сам standalone.
  // См. DEPLOYMENT.md.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // geolocation=(self) — используется на /checkout для определения зоны доставки.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;

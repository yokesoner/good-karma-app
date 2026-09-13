/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Временно — пока не переехали на собственную фотосъёмку в S3-совместимом
    // хранилище (см. README, часть «Фаза 5»). Тогда этот блок заменится на
    // remotePatterns с вашим CDN-доменом.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

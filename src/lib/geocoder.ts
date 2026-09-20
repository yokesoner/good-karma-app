import { CAFE } from "@/lib/delivery";

// Бесплатный геокодер OpenStreetMap — без ключа и регистрации (решение
// владельца: платные сервисы Яндекса не подключаем). Плата за бесплатность —
// жёсткая политика использования Nominatim: ~1 запрос/сек и обязательный
// User-Agent, иначе бан по IP. Если объём заказов вырастет, понадобится
// платный геокодер или свой инстанс Nominatim — это уже не вписывается в
// лимит публичного сервиса.
const NOMINATIM_API = "https://nominatim.openstreetmap.org";
const USER_AGENT = "GoodKarmaCafe/1.0 (delivery address check)";
const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_REQUEST_GAP_MS = 1100;

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  city: string | null;
};

type CacheEntry = { value: GeocodeResult | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();

// Сериализует реальные исходящие запросы с паузой между ними — несколько
// одновременных чекаутов не должны вместе пробить лимит в 1 запрос/сек.
let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function throttledFetch(url: string): Promise<Response> {
  const run = requestQueue.then(async () => {
    const wait = MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "ru" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  });
  requestQueue = run.catch(() => {});
  return run;
}

type NominatimRow = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

function toResult(row: NominatimRow | undefined): GeocodeResult | null {
  if (!row) return null;
  const city = row.address?.city ?? row.address?.town ?? row.address?.municipality ?? row.address?.village ?? null;
  return { lat: Number(row.lat), lng: Number(row.lon), formattedAddress: row.display_name, city };
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const key = `fwd:${query.trim().toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const url = new URL(`${NOMINATIM_API}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "ru");
  url.searchParams.set("limit", "1");
  // Мягкая подсказка по области поиска — не жёсткая рамка, просто приоритет
  // результатам рядом со Ставрополем при неоднозначном названии улицы.
  const d = 0.5;
  url.searchParams.set("viewbox", `${CAFE.lng - d},${CAFE.lat + d},${CAFE.lng + d},${CAFE.lat - d}`);

  const res = await throttledFetch(url.toString());
  if (!res.ok) throw new Error(`Nominatim ответил ${res.status}`);
  const rows = (await res.json()) as NominatimRow[];
  const value = toResult(rows[0]);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value?.formattedAddress ?? null;

  const url = new URL(`${NOMINATIM_API}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const res = await throttledFetch(url.toString());
  if (!res.ok) throw new Error(`Nominatim ответил ${res.status}`);
  const row = (await res.json()) as NominatimRow;
  const value = toResult(row);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value?.formattedAddress ?? null;
}

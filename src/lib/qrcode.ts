import QRCode from "qrcode";

/**
 * QR-код персональной карты Karma Club — генерируется на сервере как
 * data URL (PNG в base64), картинка отдаётся прямо в разметке без
 * отдельного запроса/роута. Кодируем не голый код, а полную ссылку на
 * страницу сотрудника (/admin/loyalty/<code>) — тогда «сканер» это просто
 * штатная камера телефона сотрудника: наведи и открой ссылку, никакого
 * отдельного JS-сканера на сайте заводить не пришлось.
 */
export async function generateLoyaltyQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: { dark: "#2A2029", light: "#00000000" },
  });
}

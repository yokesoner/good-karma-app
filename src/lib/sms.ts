type SmsRuResponse = {
  status?: string;
  status_text?: string;
  sms?: Record<string, { status?: string; status_text?: string }>;
};

function smsRuPhone(phone: string) {
  if (phone.length === 10) return `7${phone}`;
  if (phone.length === 11 && phone.startsWith("8")) return `7${phone.slice(1)}`;
  return phone;
}

export async function sendLoginCodeSms(phone: string, code: string) {
  const apiKey = process.env.SMS_RU_API_KEY?.trim();
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") throw new Error("SMS_RU_API_KEY не настроен");
    // Код показываем только в серверной консоли разработки: возвращать его
    // браузеру означало бы полностью обойти проверку владения номером.
    console.info(`[SMS dev] Код входа для ${phone}: ${code}`);
    return;
  }

  const recipient = smsRuPhone(phone);
  const body = new URLSearchParams({
    api_id: apiKey,
    to: recipient,
    msg: `Код Good Karma: ${code}. Никому его не сообщайте.`,
    json: "1",
  });
  const response = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`SMS.ru HTTP ${response.status}`);

  const result = await response.json() as SmsRuResponse;
  const delivery = result.sms?.[recipient];
  if (result.status !== "OK" || delivery?.status !== "OK") {
    throw new Error(delivery?.status_text || result.status_text || "SMS.ru отклонил сообщение");
  }
}

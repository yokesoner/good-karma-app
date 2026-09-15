const TELEGRAM_API = "https://api.telegram.org";

function botToken() {
  const value = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!value) throw new Error("TELEGRAM_BOT_TOKEN не настроен");
  return value;
}

// Имя бота не меняется на лету — кешируем в памяти процесса, чтобы не дёргать
// getMe на каждый запрос ссылки.
let cachedUsername: string | null = null;

export async function getBotUsername(): Promise<string> {
  if (cachedUsername) return cachedUsername;
  const res = await fetch(`${TELEGRAM_API}/bot${botToken()}/getMe`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; result?: { username?: string }; description?: string };
  if (!data.ok || !data.result?.username) throw new Error(data.description || "Telegram getMe отклонил запрос");
  cachedUsername = data.result.username;
  return cachedUsername;
}

export async function sendTelegramMessage(chatId: string, text: string) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(data.description || "Telegram sendMessage отклонил запрос");
}

export type TelegramUpdate = {
  update_id: number;
  message?: { chat: { id: number }; text?: string };
};

// timeout=0 — короткий опрос без long-poll ожидания: это дергается синхронно
// внутри обычного запроса к сайту, а не из фонового процесса (вебхуку нужен
// публичный HTTPS, которого пока нет ни в dev, ни до переезда на боевой хостинг).
export async function getTelegramUpdates(offset: number): Promise<TelegramUpdate[]> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken()}/getUpdates?offset=${offset}&timeout=0`, {
    cache: "no-store",
  });
  const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[]; description?: string };
  if (!data.ok) throw new Error(data.description || "Telegram getUpdates отклонил запрос");
  return data.result ?? [];
}

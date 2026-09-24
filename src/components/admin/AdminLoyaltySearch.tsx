"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { searchLoyaltyCustomers } from "@/server/adminLoyalty";
import { adminFieldClass, adminLabelClass } from "@/components/admin/formStyles";

type Result = { name: string | null; phone: string; avatarUrl: string | null; loyaltyCode: string };

// Живой список по мере ввода (с аватаркой) вместо «нашли/не нашли» по
// полному номеру — на кассе гость обычно называет только последние цифры,
// а точное совпадение только мешало бы. Поиск по contains на номере,
// таблица клиентов небольшая (одно кафе), индекс под LIKE не нужен.
export function AdminLoyaltySearch() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 3) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const current = ++requestId.current;
    const timer = window.setTimeout(async () => {
      const result = await searchLoyaltyCustomers({ phone: digits });
      if (current !== requestId.current) return;
      setSearching(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setResults(result.results);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [phone]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results && results.length === 1) router.push(`/admin/loyalty/${results[0]!.loyaltyCode}`);
  }

  const initial = (name: string | null) => name?.trim().charAt(0).toUpperCase() || "К";

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label>
          <span className={adminLabelClass}>Телефон клиента</span>
          <input
            type="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Хотя бы последние 3–4 цифры"
            className={adminFieldClass}
          />
        </label>
        {error && <p role="alert" className="text-[12.5px] text-cherry">{error}</p>}
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {searching && <p className="text-[12px] text-ink-3">Ищем…</p>}
        {!searching && results?.length === 0 && <p className="text-[12px] text-ink-3">Никого не нашли по этим цифрам.</p>}
        {results?.map((r) => (
          <button
            key={r.loyaltyCode}
            type="button"
            onClick={() => router.push(`/admin/loyalty/${r.loyaltyCode}`)}
            className="flex items-center gap-3 rounded-2xl border border-hair bg-paper px-3.5 py-3 text-left transition hover:border-plum/40 hover:bg-paper-3"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-gold/30 bg-tint-sakura text-[13px] font-bold text-cherry">
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- аватарка с диска сервера
                <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial(r.name)
              )}
            </span>
            <div className="min-w-0">
              <b className="block truncate text-[13.5px] font-semibold">{r.name || "Гость Гуд Кармы"}</b>
              <span className="text-[12px] text-ink-3">{r.phone}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

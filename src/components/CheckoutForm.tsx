"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { ASSETS } from "@/lib/assets";
import { useIdentity } from "@/lib/identity";
import { formatMoney } from "@/lib/money";
import { quoteOrder, placeOrder } from "@/server/actions";
import type { PricedOrder } from "@/server/pricing";

type Quote = { quote: PricedOrder; distanceKm: number | null; tooFar: boolean };

export function CheckoutForm() {
  const router = useRouter();
  const { lines, clear, promoCode: storedPromo, setPromo } = useCart();
  const identity = useIdentity((s) => s.identity);
  const [isPickup, setIsPickup] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [promoInput, setPromoInput] = useState(storedPromo ?? "");
  const appliedPromo = storedPromo;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    addressFlat: "",
    comment: "",
    paymentMethod: "CARD_ONLINE" as "CARD_ONLINE" | "CARD_ON_DELIVERY" | "CASH",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Если гость уже «входил» в личный кабинет (src/lib/identity.ts),
  // подставляем его имя и телефон — но только пока поля ещё пустые,
  // чтобы не затирать то, что гость успел ввести сам.
  useEffect(() => {
    if (!identity) return;
    setForm((f) =>
      f.name === "" && f.phone === "" ? { ...f, name: identity.name, phone: identity.phone } : f,
    );
  }, [identity]);

  const payload = lines.map((l) => ({
    productId: l.productId,
    qty: l.qty,
    addonIds: l.addons.map((a) => a.id),
    wokConfig: l.wokConfig
      ? { baseId: l.wokConfig.baseId, proteinId: l.wokConfig.proteinId, sauceId: l.wokConfig.sauceId }
      : undefined,
  }));

  // Пересчитываем на сервере при любом изменении, влияющем на сумму.
  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    quoteOrder({
      lines: payload,
      promoCode: appliedPromo,
      isPickup,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }).then((res) => {
      if (!cancelled && res.ok) setQuote({ quote: res.quote, distanceKm: res.distanceKm, tooFar: res.tooFar });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, appliedPromo, isPickup, coords]);

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("idle");
      },
      () => setGeoState("error"),
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await placeOrder({
        lines: payload,
        promoCode: appliedPromo,
        isPickup,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        ...form,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clear();
      router.push(`/order/${res.orderNumber}`);
    });
  };

  if (lines.length === 0) {
    return (
      <div className="grid overflow-hidden rounded-[38px] border border-white/70 bg-paper-2 shadow-[0_38px_100px_-48px_rgba(73,48,68,.62)] md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[340px] overflow-hidden md:min-h-[470px]">
          <Image
            src={ASSETS.backgrounds.deliveryRitual}
            alt="Заказ Гуд Кармы на столе"
            fill
            sizes="(min-width: 768px) 52vw, 100vw"
            className="object-cover object-[38%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#21151F]/45 to-transparent" />
          <span className="absolute bottom-6 left-6 rounded-full border border-white/20 bg-black/15 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            С кухни — к вашему столу
          </span>
        </div>
        <div className="flex flex-col justify-center bg-gradient-to-br from-tint-sakura via-paper-2 to-tint-mint p-8 md:p-12">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cherry">Пока здесь тихо</span>
          <h2 className="mt-3 max-w-[9ch] text-[34px] font-bold leading-[1.04] tracking-[-0.04em]">
            Корзина ждёт вашего выбора
          </h2>
          <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-ink-2">
            Начните с настроения: спокойные роллы, насыщенный рамен или живой огонь вока.
          </p>
          <Link
            href="/menu"
            className="mt-7 inline-flex w-fit items-center gap-3 rounded-full bg-btn px-7 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:shadow-m"
          >
            Выбрать блюдо <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    );
  }

  const q = quote?.quote;
  const field =
    "w-full rounded-[18px] border border-white/70 bg-paper/72 px-4 py-4 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.75)] outline-none transition focus:-translate-y-0.5 focus:border-cherry/35 focus:bg-paper-2 focus:ring-4 focus:ring-cherry/10";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[34px] border border-white/70 bg-paper-2/84 p-6 shadow-[0_28px_74px_-46px_rgba(73,48,68,.55)] backdrop-blur-xl md:p-9">
        <section className="mb-8">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Способ получения
          </span>
          <div className="flex gap-2">
            {([false, true] as const).map((pickup) => (
              <button
                key={String(pickup)}
                type="button"
                onClick={() => setIsPickup(pickup)}
                className={`flex-1 rounded-full border py-3.5 text-[12px] font-bold transition duration-300 ${
                  isPickup === pickup
                    ? "-translate-y-0.5 border-transparent bg-btn text-btn-fg shadow-[0_15px_28px_-18px_rgba(58,35,56,.7)]"
                    : "border-hair bg-paper/50 text-ink-2 hover:border-cherry/25 hover:bg-paper"
                }`}
              >
                {pickup ? "Самовывоз" : "Доставка"}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Контакты
          </span>
          <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
            <input
              className={field}
              placeholder="Имя"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={field}
              placeholder="Телефон"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </section>

        {isPickup ? (
          <section className="mb-8">
            <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Откуда забрать
            </span>
            <p className="text-[14px] text-ink-2">ул. Садовая, 12 · ежедневно 11:00—23:00</p>
          </section>
        ) : (
          <section className="mb-8">
            <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Адрес доставки
            </span>
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-2">
              <input
                className={field}
                placeholder="Улица и дом"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                className={field}
                placeholder="Квартира, этаж, домофон"
                value={form.addressFlat}
                onChange={(e) => setForm({ ...form, addressFlat: e.target.value })}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={locate}
                disabled={geoState === "loading"}
                className="rounded-full border border-hair bg-paper/55 px-5 py-3 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:border-cherry/30 hover:shadow-s disabled:opacity-50"
              >
                {geoState === "loading" ? "Определяем…" : "Определить моё местоположение"}
              </button>
              {quote?.distanceKm !== null && quote?.distanceKm !== undefined && (
                <span className="rounded-full bg-tint-mint px-3.5 py-2 text-[11.5px] text-ink-2">
                  <b className="font-bold text-ink">
                    {String(quote.distanceKm).replace(".", ",")} км
                  </b>{" "}
                  от кафе
                  {q?.zone ? ` · зона ${q.zone.zone}` : ""}
                </span>
              )}
            </div>
            {geoState === "error" && (
              <p className="mt-2 text-[12px] text-ink-3">
                Не удалось определить местоположение — стоимость доставки уточнит оператор.
              </p>
            )}
            {quote?.tooFar && (
              <p className="mt-3 rounded-s bg-tint-sakura px-4 py-3 text-[12.5px] text-ink-2">
                <b className="font-bold text-ink">Мы доставляем в пределах 20 км.</b> Оформите
                самовывоз — заказ будет готов за 20 минут.
              </p>
            )}
          </section>
        )}

        <section className="mb-8">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Оплата
          </span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["CARD_ONLINE", "Онлайн картой"],
                ["CARD_ON_DELIVERY", "Картой курьеру"],
                ["CASH", "Наличными"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: value })}
                className={`rounded-full border px-5 py-3 text-[12px] font-semibold transition duration-300 ${
                  form.paymentMethod === value
                    ? "-translate-y-0.5 border-transparent bg-btn text-btn-fg shadow-[0_15px_28px_-18px_rgba(58,35,56,.7)]"
                    : "border-hair bg-paper/50 text-ink-2 hover:border-cherry/25 hover:bg-paper"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <input
          className={field}
          placeholder="Комментарий к заказу"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
      </div>

      <aside className="h-fit overflow-hidden rounded-[34px] border border-white/70 bg-gradient-to-br from-paper-2 via-tint-cream to-tint-sakura p-6 shadow-[0_34px_82px_-44px_rgba(73,48,68,.62)] md:p-8 lg:sticky lg:top-24">
        <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
          Ваш заказ
        </span>

        <div className="mb-5 flex flex-col gap-3">
          {lines.map((l) => (
            <div key={l.key} className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/42 p-2.5 text-[13px] shadow-[0_12px_30px_-25px_rgba(73,48,68,.55)] backdrop-blur-md">
              <span className="relative h-12 w-12 flex-none overflow-hidden rounded-[15px] bg-paper-3">
                {l.imageUrl ? <Image src={l.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
              </span>
              <span className="min-w-0 flex-1 font-semibold">
                {l.name}
                {l.addons.length > 0 && (
                  <span className="block text-[11.5px] text-ink-3">
                    {l.addons.map((a) => a.name).join(" · ")}
                  </span>
                )}
                {l.wokConfig && (
                  <span className="block text-[11.5px] text-ink-3">
                    {l.wokConfig.baseName} · {l.wokConfig.proteinName} · {l.wokConfig.sauceName}
                  </span>
                )}
              </span>
              <span className="text-[11px] text-ink-3">× {l.qty}</span>
              <span className="text-[12px] font-bold tabular-nums">{formatMoney(l.unitPriceCents * l.qty)}</span>
            </div>
          ))}
        </div>

        <div className="mb-5 border-t border-hair pt-5">
          <div className="flex gap-2 rounded-[18px] border border-white/70 bg-white/38 p-2 backdrop-blur-md">
            <input
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] outline-none"
              placeholder="Промокод"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setPromo(promoInput.trim() || null)}
              className="rounded-full bg-[#3A2338] px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FFF8F2] shadow-s transition hover:-translate-y-0.5"
            >
              Применить
            </button>
          </div>
          {q?.promoError && <p className="mt-2 text-[12px] text-cherry">{q.promoError}</p>}
          {q?.promoCode && (
            <p className="mt-2 text-[12px] text-mint-deep">Промокод {q.promoCode} применён</p>
          )}
        </div>

        {q && (
          <div className="flex flex-col gap-2 border-t border-hair pt-4 text-[13px]">
            <div className="flex justify-between">
              <span className="text-ink-2">Сумма</span>
              <span className="tabular-nums">{formatMoney(q.subtotalCents)}</span>
            </div>
            {q.discountCents > 0 && (
              <div className="flex justify-between text-mint-deep">
                <span>Скидка</span>
                <span className="tabular-nums">−{formatMoney(q.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-2">
                Доставка{q.zone ? ` · зона ${q.zone.zone}` : ""}
              </span>
              <span className="tabular-nums">
                {isPickup
                  ? "самовывоз"
                  : q.deliveryCents === 0
                    ? "бесплатно"
                    : formatMoney(q.deliveryCents)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-hair pt-3">
              <span className="font-semibold">К оплате</span>
              <span className="text-[21px] font-bold tabular-nums">{formatMoney(q.totalCents)}</span>
            </div>
            <p className="mt-1 text-[11.5px] text-ink-3">
              Начислим {q.karmaEarned} карма-баллов после доставки
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-[12.5px] text-cherry">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={pending || quote?.tooFar}
          className="mt-5 w-full rounded-full bg-btn py-4 text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition hover:-translate-y-0.5 hover:shadow-m disabled:opacity-50"
        >
          {pending ? "Оформляем…" : "Оформить заказ"}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-3">
          Нажимая кнопку, вы соглашаетесь с условиями сервиса и обработкой данных.
        </p>
      </aside>
    </div>
  );
}

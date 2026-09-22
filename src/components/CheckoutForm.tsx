"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CafeMap } from "@/components/CafeMap";
import { useCart } from "@/lib/cart";
import { ASSETS } from "@/lib/assets";
import { CAFE_ADDRESS } from "@/lib/delivery";
import { useIdentity } from "@/lib/identity";
import { formatDiscount, formatMoney } from "@/lib/money";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import { quoteOrder, placeOrder, reverseGeocodeAddress } from "@/server/actions";
import { getProfileData } from "@/server/profile";
import type { PricedOrder } from "@/server/pricing";

const PAYMENT_METHODS_BY_FULFILLMENT = {
  pickup: ["CARD_ONLINE", "CARD_ON_DELIVERY", "CASH"],
  delivery: ["CARD_ONLINE"],
} as const;

type DiscountGrant = { id: string; rewardTitle: string; discountType: "PERCENT" | "FIXED"; discountPct: number; discountFixedCents: number };

type Quote = {
  quote: PricedOrder;
  distanceKm: number | null;
  addressError: string | null;
  rewardError: string | null;
  discountError: string | null;
};

export function CheckoutForm() {
  const router = useRouter();
  const { lines, clear, promoCode: storedPromo, setPromo } = useCart();
  const identity = useIdentity((s) => s.identity);
  const [isPickup, setIsPickup] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">("idle");
  const [checkingAddress, setCheckingAddress] = useState(false);
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
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; line: string; flat: string | null }[]>([]);
  const [discountGrants, setDiscountGrants] = useState<DiscountGrant[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);

  // Если гость уже «входил» в личный кабинет (src/lib/identity.ts),
  // подставляем его имя и телефон — но только пока поля ещё пустые,
  // чтобы не затирать то, что гость успел ввести сам.
  useEffect(() => {
    if (!identity) return;
    setForm((f) =>
      f.name === "" && f.phone === "" ? { ...f, name: identity.name, phone: identity.phone } : f,
    );
  }, [identity]);

  // Сохранённые адреса из профиля (/profile) — доступны только если у
  // браузера есть действующая серверная сессия (проверяется в
  // getProfileData по cookie, а не по identity из localStorage), поэтому
  // просто вызываем её и тихо ничего не показываем, если сессии нет.
  useEffect(() => {
    if (!identity) return;
    getProfileData().then((res) => {
      if (res) {
        setSavedAddresses(res.addresses);
        setDiscountGrants(res.discountGrants);
      }
    });
  }, [identity]);

  const payload = lines.map((l) => ({
    productId: l.productId,
    qty: l.qty,
    addonIds: l.addons.map((a) => a.id),
    wokConfig: l.wokConfig
      ? { baseId: l.wokConfig.baseId, proteinId: l.wokConfig.proteinId, sauceId: l.wokConfig.sauceId }
      : undefined,
    rewardId: l.rewardId ?? undefined,
  }));

  // Адрес геокодируется на сервере при каждом изменении — дебаунс, чтобы не
  // дёргать геокодер на каждый символ (см. src/lib/geocoder.ts, там же
  // троттлинг и кэш на случай нескольких вкладок/чекаутов одновременно).
  const [debouncedAddress, setDebouncedAddress] = useState(form.address);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAddress(form.address), 700);
    return () => clearTimeout(t);
  }, [form.address]);

  // Пересчитываем на сервере при любом изменении, влияющем на сумму. Для
  // доставки сервер сам геокодирует текст адреса и проверяет город и
  // расстояние — координаты клиент больше не присылает (их можно было
  // подменить в devtools, см. src/server/actions.ts).
  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    if (!isPickup && debouncedAddress) setCheckingAddress(true);
    quoteOrder({
      lines: payload,
      // Личная скидка Karma Club и промокод — один слот, взаимоисключают
      // друг друга (см. actions.ts): пока грант выбран, текст промокода
      // на сервер не уходит вообще, а не просто игнорируется в интерфейсе.
      promoCode: selectedGrantId ? null : appliedPromo,
      isPickup,
      address: isPickup ? undefined : debouncedAddress,
      phone: form.phone || undefined,
      karmaDiscountGrantId: selectedGrantId,
    }).then((res) => {
      if (cancelled) return;
      setCheckingAddress(false);
      if (res.ok) setQuote({ quote: res.quote, distanceKm: res.distanceKm, addressError: res.addressError, rewardError: res.rewardError, discountError: res.discountError });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, appliedPromo, isPickup, debouncedAddress, form.phone, selectedGrantId]);

  // Доставка допускает только онлайн-оплату (курьер денег не берёт) — при
  // переключении на доставку сбрасываем выбор, если он уже не в списке
  // разрешённых для этого способа получения. Сервер (src/server/actions.ts)
  // дублирует эту проверку — клиенту не доверяем.
  useEffect(() => {
    const allowed: readonly string[] = isPickup
      ? PAYMENT_METHODS_BY_FULFILLMENT.pickup
      : PAYMENT_METHODS_BY_FULFILLMENT.delivery;
    if (!allowed.includes(form.paymentMethod)) {
      setForm((f) => ({ ...f, paymentMethod: "CARD_ONLINE" }));
    }
  }, [isPickup, form.paymentMethod]);

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        reverseGeocodeAddress(pos.coords.latitude, pos.coords.longitude).then((res) => {
          if (res.ok) {
            setForm((f) => ({ ...f, address: res.address }));
            setGeoState("idle");
          } else {
            setGeoState("error");
          }
        });
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
        promoCode: selectedGrantId ? null : appliedPromo,
        isPickup,
        karmaDiscountGrantId: selectedGrantId,
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
    "w-full rounded-[18px] border border-white/70 bg-paper/70 px-4 py-4 text-[14px] shadow-[inset_0_1px_0_rgba(255,255,255,.75)] outline-none transition focus:-translate-y-0.5 focus:border-cherry/35 focus:bg-paper-2 focus:ring-4 focus:ring-cherry/10";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[34px] border border-white/70 bg-paper-2/85 p-6 shadow-[0_28px_74px_-46px_rgba(73,48,68,.55)] backdrop-blur-xl md:p-9">
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
                className={`flex-1 rounded-full border py-3.5 text-[12px] font-bold transition duration-300 active:scale-[0.97] ${
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
            <p className="text-[14px] text-ink-2">{CAFE_ADDRESS} · ежедневно 11:00—23:00</p>
            <CafeMap className="mt-4 text-ink-2" />
          </section>
        ) : (
          <section className="mb-8">
            <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Адрес доставки
            </span>
            <p className="mb-3 text-[12.5px] text-ink-3">
              Доставляем только по Ставрополю, в пределах 20 км от кафе.
            </p>
            {savedAddresses.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {savedAddresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, address: a.line, addressFlat: a.flat ?? "" }))}
                    className="rounded-full border border-hair bg-paper/55 px-4 py-2 text-[11.5px] font-semibold transition duration-300 active:scale-95 hover:-translate-y-0.5 hover:border-cherry/30 hover:shadow-s"
                  >
                    📍 {a.label}
                  </button>
                ))}
              </div>
            )}
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
                className="rounded-full border border-hair bg-paper/55 px-5 py-3 text-[11px] font-semibold transition duration-300 active:scale-[0.97] hover:-translate-y-0.5 hover:border-cherry/30 hover:shadow-s disabled:opacity-50 disabled:active:scale-100"
              >
                {geoState === "loading" ? "Определяем…" : "Определить моё местоположение"}
              </button>
              {checkingAddress && (
                <span className="text-[11.5px] text-ink-3">Проверяем адрес…</span>
              )}
              {!checkingAddress && !quote?.addressError && quote?.distanceKm !== null && quote?.distanceKm !== undefined && (
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
                Не удалось определить адрес по местоположению — введите его вручную.
              </p>
            )}
            {quote?.addressError && (
              <p className="mt-3 rounded-s bg-tint-sakura px-4 py-3 text-[12.5px] text-ink-2">
                <b className="font-bold text-ink">{quote.addressError}</b>
              </p>
            )}
          </section>
        )}

        <section className="mb-8">
          <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
            Оплата
          </span>
          <div className="flex flex-wrap gap-2">
            {(isPickup ? PAYMENT_METHODS_BY_FULFILLMENT.pickup : PAYMENT_METHODS_BY_FULFILLMENT.delivery).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: value })}
                className={`rounded-full border px-5 py-3 text-[12px] font-semibold transition duration-300 active:scale-[0.97] ${
                  form.paymentMethod === value
                    ? "-translate-y-0.5 border-transparent bg-btn text-btn-fg shadow-[0_15px_28px_-18px_rgba(58,35,56,.7)]"
                    : "border-hair bg-paper/50 text-ink-2 hover:border-cherry/25 hover:bg-paper"
                }`}
              >
                {PAYMENT_METHOD_LABELS[value]}
              </button>
            ))}
          </div>
          {form.paymentMethod === "CARD_ONLINE" && (
            <p className="mt-3 text-[11.5px] text-ink-3">
              Онлайн-оплата пока подключается — после заказа с вами свяжется администратор, чтобы принять оплату.
            </p>
          )}
          {!isPickup && (
            <p className="mt-3 text-[11.5px] text-ink-3">
              Для доставки доступна только онлайн-оплата — курьер деньги не принимает.
            </p>
          )}
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
            <div key={l.key} className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/40 p-2.5 text-[13px] shadow-[0_12px_30px_-25px_rgba(73,48,68,.55)] backdrop-blur-md">
              <span className="relative h-12 w-12 flex-none overflow-hidden rounded-[15px] bg-paper-3">
                {l.imageUrl ? <Image src={l.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
              </span>
              <span className="min-w-0 flex-1 font-semibold">
                {l.name}
                {l.rewardId ? (
                  <span className="block text-[11.5px] font-semibold text-mint-deep">🎁 Подарок за баллы</span>
                ) : (
                  <>
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
                  </>
                )}
              </span>
              {l.rewardId ? (
                <span className="text-[12px] font-bold text-mint-deep">Бесплатно</span>
              ) : (
                <>
                  <span className="text-[11px] text-ink-3">× {l.qty}</span>
                  <span className="text-[12px] font-bold tabular-nums">{formatMoney(l.unitPriceCents * l.qty)}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Подарок уровня Karma Club (MILESTONE_GIFT) — серверная строка,
            которой нет в клиентской корзине (lines выше), поэтому
            показываем её отдельным баннером из живого пересчёта q.lines,
            а не пытаемся втиснуть в список товаров над этим блоком. */}
        {q?.lines.some((l) => l.isLevelGift) && (
          <div className="mb-4 rounded-[18px] border border-gold/25 bg-tint-gold/40 px-4 py-3 text-[12.5px] font-semibold leading-snug">
            {q.lines.filter((l) => l.isLevelGift).map((l) => l.name).join(", ")}
          </div>
        )}

        <div className="mb-5 border-t border-hair pt-5">
          {discountGrants.length > 0 && (
            <div className="mb-3">
              <span className="mb-2 block text-[11px] font-semibold text-ink-2">Скидка Karma Club</span>
              <div className="flex flex-wrap gap-2">
                {discountGrants.map((g) => {
                  const active = selectedGrantId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGrantId(active ? null : g.id)}
                      className={`rounded-full border px-4 py-2 text-[11.5px] font-semibold transition duration-300 active:scale-95 ${
                        active ? "border-transparent bg-mint-deep text-white" : "border-hair bg-paper/55 hover:border-cherry/30"
                      }`}
                    >
                      {formatDiscount(g.discountType, g.discountPct, g.discountFixedCents)} · {g.rewardTitle}{active ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {!selectedGrantId && (
            <div className="flex gap-2 rounded-[18px] border border-white/70 bg-white/40 p-2 backdrop-blur-md">
              <input
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] outline-none"
                placeholder="Промокод"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setPromo(promoInput.trim() || null)}
                className="rounded-full bg-[#3A2338] px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#FFF8F2] shadow-s transition duration-300 active:scale-95 hover:-translate-y-0.5"
              >
                Применить
              </button>
            </div>
          )}
          {q?.promoError && <p className="mt-2 text-[12px] text-cherry">{q.promoError}</p>}
          {q?.promoCode && (
            <p className="mt-2 text-[12px] text-mint-deep">Промокод {q.promoCode} применён</p>
          )}
          {q?.karmaDiscountApplied && (
            <p className="mt-2 text-[12px] text-mint-deep">Скидка Karma Club применена</p>
          )}
          {q?.levelDiscountApplied && (
            <p className="mt-2 text-[12px] text-mint-deep">{q.levelDiscountLabel}</p>
          )}
          {quote?.discountError && <p className="mt-2 text-[12px] text-cherry">{quote.discountError}</p>}
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
            <div className="mt-2 flex items-baseline justify-between overflow-hidden border-t border-hair pt-3">
              <span className="font-semibold">К оплате</span>
              <span key={q.totalCents} className="wok-value-in text-[21px] font-bold tabular-nums">
                {formatMoney(q.totalCents)}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-ink-3">
              Начислим {q.karmaEarned} карма-баллов после доставки
            </p>
          </div>
        )}

        {quote?.rewardError && <p className="mt-4 text-[12.5px] text-cherry">{quote.rewardError}</p>}
        {error && <p className="mt-4 text-[12.5px] text-cherry">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={pending || Boolean(quote?.addressError) || Boolean(quote?.rewardError)}
          className="btn-sheen mt-5 w-full rounded-full bg-btn py-4 text-[10.5px] font-bold uppercase tracking-[0.08em] text-btn-fg shadow-[0_18px_34px_-20px_rgba(58,35,56,.72)] transition duration-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-m disabled:opacity-50 disabled:active:scale-100"
        >
          {pending ? "Оформляем…" : "Оформить заказ"}
        </button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-3">
          Нажимая кнопку, вы соглашаетесь с{" "}
          <Link href="/terms" className="underline hover:text-ink-2">условиями сервиса</Link>{" "}
          и{" "}
          <Link href="/privacy" className="underline hover:text-ink-2">обработкой данных</Link>.
        </p>
      </aside>
    </div>
  );
}

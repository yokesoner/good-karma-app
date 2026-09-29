"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getProfileData, addAddress, removeAddress } from "@/server/profile";
import { redeemDiscountReward } from "@/server/karmaRewards";
import { formatDiscount, formatMoney } from "@/lib/money";
import { karmaSnapshot, timesPerWeek } from "@/lib/karma";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { ORDER_STATUS_LABELS } from "@/lib/orderLabels";
import { LevelIcon } from "@/components/LevelIcon";
import { LevelPath } from "@/components/LevelPath";
import { RewardPath, type PathReward } from "@/components/RewardPath";
import { KarmaPass } from "@/components/KarmaPass";
import { AvatarUploader } from "@/components/AvatarUploader";
import { ProfileLoading } from "@/components/ProfileLoading";
import { ArrowUpRight, Check, ChevronDown, Gift } from "@/components/icons";
import { ShowMore } from "@/components/Collapsible";

// Сколько заказов показывать сразу — остальное за «Показать ещё», чтобы
// длинная история не растягивала профиль на телефоне на несколько экранов
// вниз. Подарки теперь — лента-путь, она не растёт вниз при любом числе.
const ORDERS_PREVIEW_COUNT = 3;

type ProfileData = NonNullable<Awaited<ReturnType<typeof getProfileData>>>;

export function ProfileView({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestId = useRef(0);
  const load = useCallback(() => {
    const current = ++requestId.current;
    setLoadError(null);
    getProfileData().then((res) => {
      // Поздний ответ не должен перезаписать более свежий баланс или другой профиль.
      if (current !== requestId.current) return;
      if (!res) setLoadError("Сессия истекла или устройство больше не подтверждено. Войдите заново.");
      else setData(res);
    }).catch(() => {
      if (current === requestId.current) setLoadError("Связь с кафе прервалась. Проверьте интернет и попробуйте ещё раз.");
    });
  }, []);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const errorPanel = loadError && <div role="alert" className="rounded-[28px] border border-cherry/20 bg-paper-2 p-6 shadow-s">
    <p className="text-[15px] font-semibold">Профиль немного задерживается</p>
    <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{loadError}</p>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={load} className="min-h-11 rounded-full bg-btn px-5 text-[12px] font-semibold text-btn-fg">Повторить загрузку</button><button type="button" onClick={onLogout} className="min-h-11 rounded-full border border-hair px-5 text-[12px]">Вернуться ко входу</button></div>
  </div>;
  if (!data) return errorPanel || <ProfileLoading />;

  const snap = karmaSnapshot(data.points, data.levels, data.rewards);

  return (
    <div className="profile-dashboard flex flex-col gap-8">
      {errorPanel}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <AvatarUploader
            avatarUrl={data.user.avatarUrl}
            name={data.user.name}
            onChanged={(url) => setData((prev) => (prev ? { ...prev, user: { ...prev.user, avatarUrl: url } } : prev))}
          />
          <div className="min-w-0">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Личный кабинет
            </span>
            <h1 className="break-words text-[30px] font-bold leading-tight tracking-[-0.04em] md:text-[42px]">
              Рады видеть, {data.user.name || "друг"}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-s border border-hair px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2 transition duration-200 active:scale-95 hover:border-ink-3"
        >
          Выйти
        </button>
      </div>

      <nav aria-label="Разделы профиля" className="grid max-w-[420px] grid-cols-3 gap-2">
        {[["#profile-rewards", "Подарки"], ["#profile-orders", "Заказы"], ["#profile-addresses", "Адреса"]].map(([href, title]) => <a key={href} href={href} className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-full border border-gold/20 bg-paper-2 px-3 text-[11px] font-medium shadow-s transition hover:border-gold/60 hover:shadow-m">{title}</a>)}
      </nav>

      {snap && (
        // Карта — во всю колонку и высоту ряда (fill). Раньше у неё был
        // max-w-[560px] в колонке шире 630px и items-start у сетки: справа и
        // снизу от карты оставались пустые поля. Правая колонка собрана так,
        // чтобы по высоте совпадать с картой: «следующий уровень» переехал
        // шкалой в карточку уровня и путём уровней ниже.
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <KarmaPass
            fill
            name={data.user.name || "Гость Гуд Кармы"}
            phone={data.user.phone}
            points={snap.points}
            level={snap.level.name}
            levelIcon={snap.level.icon}
            progressPct={snap.progressPct}
          />

          <div className="flex min-w-0 flex-col gap-3">
            <LevelDiscountCard
              level={snap.level}
              levelDiscount={data.levelDiscount}
              nextLevelName={snap.nextLevel?.name ?? null}
              pointsToNext={snap.pointsToNext}
              progressPct={snap.progressPct}
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Заказы", data.orders.length, "в истории"],
                ["Адреса", data.addresses.length, "сохранено"],
              ].map(([label, value, caption]) => (
                <article key={label} className="rounded-[22px] border border-white/70 bg-paper-2/85 px-5 py-4 shadow-[0_18px_44px_-34px_rgba(73,48,68,.52)]">
                  <span className="text-micro font-bold uppercase tracking-[0.16em] text-ink-3">{label}</span>
                  <b className="mt-1.5 block text-[28px] leading-none tracking-[-0.04em]">{value}</b>
                  <span className="mt-1.5 block text-caption text-ink-3">{caption}</span>
                </article>
              ))}
            </div>
            <a
              href="#profile-journey"
              className="flex min-h-12 items-center justify-between rounded-full bg-[#3A2338] px-6 text-micro font-bold uppercase tracking-[0.11em] text-[#FFF8F2] shadow-[0_16px_32px_-20px_rgba(58,35,56,.7)] transition hover:-translate-y-0.5"
            >
              Мой путь в клубе <ChevronDown className="text-[14px]" />
            </a>
          </div>
        </section>
      )}

      <section id="profile-journey" className="scroll-mt-24 rounded-[30px] border border-gold/20 bg-paper-2/90 p-5 shadow-m sm:p-8">
        <p className="mb-3 text-micro font-bold uppercase tracking-[0.18em] text-cherry">Karma Club</p>
        <LevelPath
          title="Ваш путь в клубе"
          headingAs="h2"
          points={data.points}
          levels={data.levels.map((level) => ({
            key: level.key,
            name: level.name,
            fromKarma: level.fromKarma,
            icon: level.icon,
            perk: level.perk,
            discountPct: level.discountPct,
            discountsPerWeek: level.discountsPerWeek,
          }))}
        />
      </section>

      <RewardsSection data={data} onChanged={load} />

      <section id="profile-orders" className="scroll-mt-24 rounded-[30px] border border-hair bg-paper-2/90 p-5 shadow-m sm:p-8">
        <h2 className="mb-5 text-[23px] font-bold tracking-tight">Ваши вкусные моменты</h2>
        {data.orders.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-gold/30 bg-tint-cream p-6"><p className="text-[15px] font-semibold">Первое знакомство ещё впереди</p><p className="mt-2 text-[13px] leading-relaxed text-ink-2">Здесь появятся ваши заказы. Начнём с любимого блюда?</p><Link href="/menu" className="mt-4 inline-flex min-h-11 items-center gap-3 text-[12px] font-semibold text-cherry">Выбрать в меню <ArrowUpRight className="text-[14px]" /></Link></div>
        ) : (
          <div className="flex flex-col">
            <ShowMore
              items={data.orders}
              initialCount={ORDERS_PREVIEW_COUNT}
              moreLabel={(n) => `Показать ещё ${n} из истории`}
              render={(o) => (
                <Link
                  key={o.number}
                  href={`/order/${o.number}`}
                  className="grid min-w-0 grid-cols-2 items-center gap-x-3 gap-y-2 rounded-[16px] border-b border-hair-soft px-3 py-4 text-[12px] last:border-b-0 hover:bg-hair-soft md:flex md:gap-4 md:text-[13.5px]"
                >
                  <span className="font-bold">{o.number}</span>
                  <span className="text-right text-ink-3 md:text-left">{o.createdAt.toLocaleDateString("ru-RU")}</span>
                  <span className="text-ink-3">{o.itemsCount} поз.</span>
                  <span className="col-span-2 row-start-3 w-fit rounded-full bg-tint-mint px-3 py-1 text-[11px] text-ink-2 md:ml-auto">
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <span className="col-start-2 row-start-2 text-right font-semibold tabular-nums md:w-[86px] md:shrink-0">{formatMoney(o.totalCents)}</span>
                </Link>
              )}
            />
          </div>
        )}
      </section>

      <AddressesSection addresses={data.addresses} onChanged={load} />
    </div>
  );
}

type RewardProduct = ProfileData["rewards"][number]["products"][number];
type SnapLevel = ProfileData["levels"][number];
type LevelDiscount = ProfileData["levelDiscount"];

// Скидка уровня и остаток применений на неделе. Цифры приходят с сервера
// (resolveLevelDiscountForUser) — здесь их только показываем, чтобы карточка
// в профиле и реальный расчёт на чекауте не могли разойтись. У стартового
// уровня скидки нет, и тогда показываем базовое правило начисления: karma
// каждого товара в каталоге посчитана как round(цена/10), см. seed.json.
function LevelDiscountCard({
  level,
  levelDiscount,
  nextLevelName,
  pointsToNext,
  progressPct,
}: {
  level: SnapLevel;
  levelDiscount: LevelDiscount;
  nextLevelName: string | null;
  pointsToNext: number;
  progressPct: number;
}) {
  const exhausted = levelDiscount !== null && levelDiscount.left === 0;

  return (
    // flex-1: карточка забирает свободную высоту колонки, а шкала до
    // следующего уровня прижата к низу — без пустоты внутри и под картой.
    <article className="flex flex-1 flex-col justify-between gap-5 rounded-[25px] border border-gold/25 bg-gradient-to-br from-[#3A2338] to-[#4A2C46] p-5 text-[#FFF8F2] shadow-[0_18px_44px_-34px_rgba(58,35,56,.7)]">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white/10"><LevelIcon name={level.icon} className="h-5 w-5 text-[#F7D9A6]" /></span>
          <div className="min-w-0">
            <span className="block text-micro font-bold uppercase tracking-[0.16em] text-white/55">Уровень «{level.name}»</span>
            <p className="mt-0.5 text-[14px] font-semibold leading-snug">
              {levelDiscount
                ? `−${levelDiscount.pct}% на заказ · ${timesPerWeek(levelDiscount.perWeek)}`
                : "10 ₽ покупок = 1 балл кармы"}
            </p>
          </div>
        </div>

        {levelDiscount && (
          <p className={`mt-3 text-[12px] leading-snug ${exhausted ? "text-[#FFD8D8]" : "text-white/70"}`}>
            {exhausted
              ? "Скидки на этой неделе закончились — применятся снова, когда обновится неделя."
              : `Осталось ${levelDiscount.left} из ${levelDiscount.perWeek} на этой неделе. Применяется на чекауте сама.`}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3 text-[12px]">
          <span className="font-semibold text-[#F7D9A6]">{nextLevelName ? `До «${nextLevelName}»` : "Высший уровень клуба"}</span>
          {nextLevelName && <span className="tabular-nums text-white/70">{pointsToNext.toLocaleString("ru-RU")} баллов</span>}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F0AFC3] to-[#F7D9A6] transition-[width] duration-700 ease-out"
            style={{ width: `${nextLevelName ? Math.min(100, Math.max(3, progressPct)) : 100}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function RewardsSection({ data, onChanged }: { data: ProfileData; onChanged: () => void }) {
  const { lines, add, remove } = useCart();
  const showToast = useToast((s) => s.show);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  async function redeemDiscount(rewardId: string, title: string) {
    if (redeemingId) return;
    setRedeemError(null);
    setRedeemingId(rewardId);
    try {
      const result = await redeemDiscountReward({ rewardId });
      if (!result.ok) {
        setRedeemError(result.error);
        return;
      }
      showToast(`Скидка получена: ${title}`);
      onChanged();
    } catch {
      setRedeemError("Не удалось подтвердить обмен. Обновите профиль, чтобы проверить баланс.");
    } finally {
      setRedeemingId(null);
    }
  }

  const rewardById = new Map(data.rewards.map((r) => [r.id, r]));
  const pathRewards: PathReward[] = data.rewards.map((r) => {
    const product = r.products.find((p) => p.imageUrl) ?? null;
    return {
      id: r.id,
      costPoints: r.costPoints,
      title: r.title,
      description: r.description,
      image: product?.imageUrl ? { url: product.imageUrl, alt: product.name } : null,
      discountLabel:
        r.kind === "DISCOUNT" && r.discountType ? formatDiscount(r.discountType, r.discountPct ?? 0, r.discountFixedCents ?? 0) : null,
      minLevelName: r.minLevelName,
      // Уровень ниже нужного или недельный лимит обменов — не про баланс,
      // считает сервер (checkRewardEligibility).
      restriction: r.restrictionError,
    };
  });

  // Действие открытого подарка. Награды переиспользуемые — доступность решает
  // только текущий баланс, без разового «получено навсегда»; баллы за
  // товарный подарок списываются при оформлении заказа, а не по клику.
  function renderAction(reward: PathReward) {
    const r = rewardById.get(reward.id);
    if (!r) return null;
    const cartLine = lines.find((l) => l.rewardId === r.id);
    const primary =
      "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-btn px-4 text-[12px] font-bold text-btn-fg shadow-s transition duration-200 active:scale-95 disabled:opacity-50";

    function addProduct(product: RewardProduct) {
      add(
        {
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPriceCents: product.priceCents,
          addons: [],
          wokConfig: null,
          rewardId: r!.id,
        },
        1,
      );
      showToast(`Добавлено в корзину: ${product.name} · подарок за баллы`);
    }

    if (cartLine) {
      return (
        <div className="flex min-h-10 items-center justify-between gap-2 rounded-full bg-tint-mint px-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink">
            <Check className="text-[14px] text-mint-deep" strokeWidth={2.2} /> В корзине
          </span>
          <button type="button" onClick={() => remove(cartLine.key)} className="text-caption font-semibold text-ink-3 hover:text-cherry">
            Убрать
          </button>
        </div>
      );
    }
    if (r.kind === "DISCOUNT") {
      return (
        <button type="button" disabled={redeemingId === r.id} onClick={() => redeemDiscount(r.id, r.title)} className={primary}>
          {redeemingId === r.id ? "Обмениваем…" : `Получить ${reward.discountLabel ?? "скидку"}`}
        </button>
      );
    }
    if (r.products.length === 0) return <p className="text-[12px] text-ink-3">Скоро подберём блюдо для этого подарка</p>;
    if (r.products.length === 1) {
      return (
        <button type="button" onClick={() => addProduct(r.products[0]!)} className={primary}>
          <Gift className="text-[15px]" /> В корзину
        </button>
      );
    }
    return (
      <div>
        <p className="mb-2 text-caption text-ink-3">Выберите вариант:</p>
        <div className="flex flex-wrap gap-1.5">
          {r.products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="min-h-9 rounded-full border border-hair bg-paper px-3 text-caption font-semibold transition active:scale-95 hover:border-cherry/40"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section id="profile-rewards" className="scroll-mt-24 rounded-[30px] border border-gold/20 bg-paper-2/90 p-5 shadow-m sm:p-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-micro font-bold uppercase tracking-[0.18em] text-cherry">От кухни с любовью</span>
        <Link href="/karma-club/rules" className="text-caption font-semibold text-ink-3 hover:text-cherry hover:underline">Правила использования</Link>
      </div>
      {redeemError && <p role="alert" className="mb-4 text-[12.5px] text-cherry">{redeemError}</p>}
      {data.rewards.length === 0 ? (
        <>
          <h2 className="text-[22px] font-bold tracking-tight">Ваши подарки</h2>
          <p className="mt-2 text-[13px] text-ink-2">Готовим новые подарки. Загляните чуть позже.</p>
        </>
      ) : (
        <RewardPath rewards={pathRewards} points={data.points} title="Ваши подарки" headingAs="h2" renderAction={renderAction} />
      )}

      {data.discountGrants.length > 0 && (
        <div className="mt-8 border-t border-hair pt-6">
          <span className="text-micro font-bold uppercase tracking-[0.16em] text-ink-3">Мои скидки</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.discountGrants.map((g) => (
              <span key={g.id} className="rounded-full border border-mint-deep/30 bg-tint-mint px-4 py-2 text-[11.5px] font-semibold text-ink">
                {formatDiscount(g.discountType, g.discountPct, g.discountFixedCents)} · {g.rewardTitle}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-3">Применяется на чекауте вместо промокода.</p>
        </div>
      )}
    </section>
  );
}

function AddressesSection({
  addresses,
  onChanged,
}: {
  addresses: ProfileData["addresses"];
  onChanged: () => void;
}) {
  const [form, setForm] = useState({ label: "", line: "", flat: "" });
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = saving || removingId !== null;

  const submit = async () => {
    if (pending) return;
    setError(null);
    setSaving(true);
    try {
      const res = await addAddress(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setForm({ label: "", line: "", flat: "" });
      onChanged();
    } catch {
      setError("Не удалось подтвердить сохранение. Проверьте список адресов перед повторной попыткой.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (addressId: string) => {
    if (pending) return;
    setError(null);
    setRemovingId(addressId);
    try {
      const result = await removeAddress({ addressId });
      if (!result.ok) { setError(result.error); return; }
      onChanged();
    } catch {
      setError("Не удалось подтвердить удаление адреса. Обновите профиль, чтобы проверить его состояние.");
    } finally {
      setRemovingId(null);
    }
  };

  const field =
    "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-hair bg-paper-2 px-3 py-3 text-[16px] outline-none transition focus:border-cherry focus:ring-2 focus:ring-cherry/15";

  return (
    <section id="profile-addresses" className="scroll-mt-24 rounded-[30px] border border-hair bg-paper-2/90 p-5 shadow-m sm:p-8">
      <h2 className="text-[23px] font-bold tracking-tight">Куда привезти хорошее?</h2>
      <p className="mb-6 mt-2 text-[13px] leading-relaxed text-ink-2">Сохранённые адреса — чтобы любимое было ближе.</p>
      {addresses.length > 0 && (
        <div className="mb-6 flex flex-col">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-4 border-b border-hair-soft py-3.5 text-[13.5px] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <b className="font-bold">{a.label}</b>
                <p className="break-words text-ink-2">
                  {a.line}
                  {a.flat ? `, ${a.flat}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(a.id)}
                className="min-h-11 shrink-0 px-2 text-[11.5px] text-ink-2 hover:text-cherry disabled:opacity-50"
              >
                {removingId === a.id ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={pending} className="grid min-w-0 grid-cols-1 gap-4 rounded-[22px] border border-hair bg-paper/60 p-4 lg:grid-cols-2">
        <legend className="px-2 text-[12px] font-semibold">Новый адрес</legend>
        <label className="min-w-0 text-[11px] font-medium text-ink-2">Название<input
          className={field}
          placeholder="Например, дом"
          name="address-label"
          maxLength={40}
          required
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
        /></label>
        <label className="min-w-0 text-[11px] font-medium text-ink-2">Улица и дом<input
          className={field}
          placeholder="Улица, номер дома"
          name="street-address"
          autoComplete="street-address"
          maxLength={200}
          minLength={3}
          required
          value={form.line}
          onChange={(e) => setForm({ ...form, line: e.target.value })}
        /></label>
        <label className="min-w-0 text-[11px] font-medium text-ink-2 lg:col-span-2">Квартира, этаж, домофон <span className="font-normal">· необязательно</span><input
          className={field}
          placeholder="Квартира, этаж, домофон"
          name="address-details"
          maxLength={80}
          value={form.flat}
          onChange={(e) => setForm({ ...form, flat: e.target.value })}
        /></label>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-[12.5px] text-cherry">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 rounded-full bg-btn px-6 py-3 text-[12px] font-semibold text-btn-fg shadow-s transition duration-200 active:scale-[0.98] hover:shadow-m disabled:opacity-50 disabled:active:scale-100"
      >
        {saving ? "Сохраняем…" : "Сохранить адрес"}
      </button>
      </form>
    </section>
  );
}

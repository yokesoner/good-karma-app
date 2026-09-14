"use client";

import { useEffect, useState } from "react";
import { useIdentity } from "@/lib/identity";
import { logoutCustomer, requestLoginCode, verifyLoginCode } from "@/server/identity";
import { ProfileView } from "@/components/ProfileView";
import { KarmaPass } from "@/components/KarmaPass";
import { ProfileLoading } from "@/components/ProfileLoading";

export function ProfileGate() {
  const identity = useIdentity((s) => s.identity);
  const setIdentity = useIdentity((s) => s.setIdentity);
  const clear = useIdentity((s) => s.clear);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // До гидратации persist-стор ещё не прочитал localStorage — не показываем
  // форму на долю секунды, чтобы не мигать между «войдите» и профилем.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  if (!mounted) return <ProfileLoading />;

  if (identity) {
    const logout = () => {
      clear();
      void logoutCustomer();
    };
    return <ProfileView key={identity.userId} onLogout={logout} />;
  }

  const sendCode = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await requestLoginCode(phone);
      if (!res.ok) {
        setError(res.error);
        if (res.retryAfterSeconds) setCooldown(res.retryAfterSeconds);
        return;
      }
      setStep("code");
      setCode("");
      setCooldown(res.retryAfterSeconds);
    } catch {
      setError("Не удалось связаться с кафе. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const res = await verifyLoginCode(phone, code);
      if (!res.ok) return setError(res.error);
      setIdentity({ userId: res.userId, name: res.name, phone: res.phone });
    } catch {
      setError("Не удалось связаться с кафе. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  };

  const submit = step === "phone" ? sendCode : verifyCode;

  return (
    <div className="mx-auto grid max-w-[1060px] overflow-hidden rounded-[32px] border border-hair bg-paper-2/95 shadow-l lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative isolate order-2 flex min-w-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#F7E9EC] via-[#F5EFE7] to-[#E6EFE9] p-5 text-[#3A2935] sm:p-8 lg:order-1 lg:p-11">
        <div aria-hidden className="profile-orbit absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cherry/10" />
        <div className="relative">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-cherry">
            Good Karma Pass
          </span>
          <h2 className="mt-4 max-w-[14ch] text-[30px] font-bold leading-[1.05] tracking-[-0.045em] sm:text-[36px] lg:text-[42px]">
            Всё ваше — в одном месте
          </h2>
        </div>

        <KarmaPass
          preview
          points={0}
          level="Seed"
          compact
          className="relative my-8 origin-center"
        />

        <div className="relative grid max-w-[330px] grid-cols-3 gap-2">
          {["Заказы", "Карма", "Адреса"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#493044]/10 bg-white/42 px-2 py-2 text-center text-[8px] font-bold uppercase tracking-[0.12em] text-[#76636F] backdrop-blur-md"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="order-1 flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:order-2 lg:p-10">
        <span className="mb-3 block text-[9.5px] font-bold uppercase tracking-[0.2em] text-cherry">
          Личный кабинет
        </span>
        <h1 className="max-w-[15ch] text-[28px] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[36px]">
          Войти по номеру телефона
        </h1>
        <p className="mt-4 max-w-[42ch] text-[13px] leading-[1.7] text-ink-2">
          {step === "phone"
            ? "Введите номер из заказа — отправим короткий код подтверждения."
            : `Введите код из SMS, отправленный на ${phone}. Код действует 5 минут.`}
        </p>
        <label className="mt-9 block">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-3">Телефон</span>
          <input
            className="mt-2 w-full rounded-[16px] border border-hair bg-paper px-4 py-4 text-[16px] outline-none transition focus:border-cherry/60 focus:ring-4 focus:ring-cherry/10"
            placeholder="+7 999 000-00-00"
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            disabled={pending || step === "code"}
            aria-invalid={!!error}
            aria-describedby={error ? "profile-login-error" : undefined}
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        {step === "code" && (
          <label className="mt-5 block">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-3">Код из SMS</span>
            <input
              className="mt-2 w-full rounded-[16px] border border-hair bg-paper px-4 py-4 text-center text-[22px] font-semibold tracking-[0.35em] outline-none transition focus:border-cherry/60 focus:ring-4 focus:ring-cherry/10"
              placeholder="0000"
              type="text"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              disabled={pending}
              aria-invalid={!!error}
              aria-describedby={error ? "profile-login-error" : undefined}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              autoFocus
            />
          </label>
        )}
        {error && <p id="profile-login-error" role="alert" className="mt-3 text-[12.5px] text-cherry">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 flex min-h-12 w-full items-center justify-between rounded-full bg-btn px-6 py-4 text-[11px] font-semibold text-btn-fg shadow-s transition motion-safe:hover:-translate-y-0.5 hover:shadow-m disabled:opacity-50"
        >
          {pending ? (step === "phone" ? "Отправляем…" : "Проверяем…") : (step === "phone" ? "Отправить код" : "Войти")}
          <span aria-hidden>→</span>
        </button>
        {step === "code" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} disabled={pending} className="text-ink-2 hover:text-ink hover:underline">Изменить номер</button>
            <button type="button" onClick={() => void sendCode()} disabled={pending || cooldown > 0} className="font-semibold text-cherry hover:underline disabled:text-ink-3 disabled:no-underline">
              {cooldown > 0 ? `Отправить снова через ${cooldown} сек.` : "Отправить код снова"}
            </button>
          </div>
        )}
        <p className="mt-4 text-[10.5px] leading-relaxed text-ink-3">
          Продолжая, вы соглашаетесь на обработку данных для работы личного кабинета.
        </p>
      </form>
    </div>
  );
}

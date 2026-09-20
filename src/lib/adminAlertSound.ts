export const ADMIN_ALERT_SOUND_KEY = "gk_admin_alert_sound";

export function isAdminAlertSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(ADMIN_ALERT_SOUND_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setAdminAlertSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(ADMIN_ALERT_SOUND_KEY, enabled ? "1" : "0");
  } catch {
    // приватный режим / заблокировано хранилище — просто не сохранится
  }
}

let sharedContext: AudioContext | null = null;

// Короткий двухтональный сигнал синтезируется через Web Audio API — без
// аудио-файла ради одного «дзынь».
export function playAdminAlertSound() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedContext) sharedContext = new Ctx();
    const ctx = sharedContext;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // звук не критичен — молча пропускаем (autoplay policy, старый браузер и т.д.)
  }
}

export function ProfileLoading() {
  return (
    <div role="status" aria-label="Загружаем личный кабинет" className="space-y-8">
      <span className="sr-only">Загружаем личный кабинет…</span>
      <div aria-hidden className="space-y-8 motion-safe:animate-pulse">
        <div className="space-y-3"><div className="h-3 w-28 rounded-full bg-hair-soft" /><div className="h-9 w-3/4 max-w-sm rounded-xl bg-hair-soft" /></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px] rounded-[30px] border border-gold/20 bg-gradient-to-br from-tint-plum to-tint-sakura p-7 shadow-m">
            <div className="h-8 w-32 rounded-full bg-hair-soft" /><div className="mt-14 h-14 w-40 rounded-xl bg-hair-soft" /><div className="mt-12 h-2 rounded-full bg-hair-soft" />
          </div>
          <div className="grid grid-cols-2 gap-3"><div className="col-span-2 rounded-[28px] border border-hair bg-paper-2 p-6"><div className="h-4 w-2/3 rounded-full bg-hair-soft" /></div><div className="h-28 rounded-[25px] bg-paper-2" /><div className="h-28 rounded-[25px] bg-paper-2" /></div>
        </div>
      </div>
    </div>
  );
}

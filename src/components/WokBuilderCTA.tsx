import Link from "next/link";

// Занимает тот же слот сетки, что ProductCard (aspect-[4/5]), но вместо
// фото блюда — приглашение в конструктор. Вставляется первым элементом
// в категорию «Вок» на /menu и /menu/[id].
export function WokBuilderCTA() {
  return (
    <Link
      href="/wok-builder"
      className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-ph border border-plum/20 bg-gradient-to-br from-tint-peach via-tint-gold to-tint-sakura p-4 transition-shadow duration-500 hover:shadow-m"
    >
      <span className="text-[34px] leading-none">🥢</span>
      <div>
        <h3 className="text-[15.5px] font-bold leading-tight">Собери свой ВОК</h3>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
          Основа, белок и соус — как захочется
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-cherry">
          Собрать →
        </span>
      </div>
    </Link>
  );
}

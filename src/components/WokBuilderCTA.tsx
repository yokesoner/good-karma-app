import Link from "next/link";

// Занимает тот же слот сетки, что ProductCard (квадрат на телефоне, 4:5 на
// планшете и десктопе), но вместо фото блюда — приглашение в конструктор.
// Вставляется первым элементом в категорию «Вок» на /menu и /menu/[id].
export function WokBuilderCTA() {
  return (
    <Link
      href="/wok-builder"
      data-reveal
      className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[22px] border border-plum/20 bg-gradient-to-br from-tint-peach via-tint-gold to-tint-sakura p-3.5 transition duration-300 active:scale-[0.985] hover:shadow-m md:aspect-[4/5] md:rounded-ph md:p-4"
    >
      <span className="text-[28px] leading-none md:text-[34px]">🥢</span>
      <div>
        <h3 className="text-[14px] font-bold leading-tight md:text-[15.5px]">Собери свой ВОК</h3>
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-ink-2 md:text-[12.5px]">
          Основа, начинка и соус — как захочется
        </p>
        <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-cherry md:mt-3 md:text-[12px]">
          Собрать →
        </span>
      </div>
    </Link>
  );
}

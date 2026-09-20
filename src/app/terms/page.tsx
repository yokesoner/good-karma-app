import type { Metadata } from "next";
import { CAFE_ADDRESS } from "@/lib/delivery";

export const metadata: Metadata = {
  title: "Пользовательское соглашение — Гуд Карма",
};

// Стартовый, разумный шаблон под доставку еды — не юридическая
// консультация. Перед реальным запуском стоит показать юристу.
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
      <div className="rounded-l border border-hair bg-paper-2 p-6 md:p-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
          Условия сервиса
        </span>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
          Пользовательское соглашение
        </h1>

        <div className="prose-terms mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-ink-2">
          <section>
            <h2 className="text-[16px] font-bold text-ink">1. Общие положения</h2>
            <p className="mt-2">
              Оформляя заказ на сайте «Гуд Карма» (далее — «сервис»), вы соглашаетесь
              с настоящими условиями. Сервис принадлежит паназиатскому кафе «Гуд Карма»,
              {" "}{CAFE_ADDRESS}.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">2. Заказ и оплата</h2>
            <p className="mt-2">
              Заказ считается оформленным после подтверждения на странице заказа.
              Способ оплаты выбирается при оформлении: часть способов доступна только
              при самовывозе. Онлайн-оплата картой сейчас находится в процессе
              подключения — после заказа с вами свяжется администратор, чтобы принять
              оплату; это не автоматический платёж.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">3. Доставка и самовывоз</h2>
            <p className="mt-2">
              Доставка осуществляется в пределах Ставрополя и его ближайших окрестностей.
              Время подачи блюд и доставки — ориентировочное, не является точной
              гарантией к минуте: приготовление начинается только после подтверждения
              заказа. При самовывозе заказ можно забрать в кафе после уведомления о
              готовности.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">4. Отмена заказа</h2>
            <p className="mt-2">
              Заказ можно отменить до начала приготовления, связавшись с кафе по
              указанному в разделе контактов телефону. После начала приготовления
              отмена возможна по согласованию с администратором.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">5. Карма-баллы</h2>
            <p className="mt-2">
              Карма-баллы начисляются за оформленные заказы и могут быть обменены на
              товары из каталога Karma Club. Баллы не являются денежным средством, не
              продаются, не передаются другим пользователям и не подлежат обмену на
              деньги.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">6. Контакты</h2>
            <p className="mt-2">
              По всем вопросам — по телефону и почте, указанным в подвале сайта.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

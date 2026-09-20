import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Гуд Карма",
};

// Стартовый, разумный шаблон под требования 152-ФЗ — не юридическая
// консультация. Перед реальным запуском стоит показать юристу.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-wrap px-5 py-10 md:px-16">
      <div className="rounded-l border border-hair bg-paper-2 p-6 md:p-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">
          Обработка данных
        </span>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight md:text-[32px]">
          Политика конфиденциальности
        </h1>

        <div className="prose-terms mt-8 flex flex-col gap-6 text-[14px] leading-relaxed text-ink-2">
          <section>
            <h2 className="text-[16px] font-bold text-ink">1. Какие данные собираются</h2>
            <p className="mt-2">
              При оформлении заказа и входе в личный кабинет сервис сохраняет: имя,
              номер телефона, адрес доставки (если он указан), историю заказов и
              карма-баллов. Вход подтверждается кодом в Telegram — пароли не
              используются и не хранятся.
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">2. Как используются данные</h2>
            <p className="mt-2">
              Данные используются только для оформления и доставки заказа, связи с
              вами по заказу, начисления карма-баллов и (по вашему желанию) хранения
              адресов для повторных заказов. Данные не передаются третьим лицам,
              кроме случаев, необходимых для исполнения заказа (например, курьерской
              службе).
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">3. Хранение</h2>
            <p className="mt-2">
              Персональные данные обрабатываются и хранятся в соответствии с
              требованиями Федерального закона № 152-ФЗ «О персональных данных».
            </p>
          </section>
          <section>
            <h2 className="text-[16px] font-bold text-ink">4. Ваши права</h2>
            <p className="mt-2">
              Вы можете в любой момент запросить удаление своих сохранённых адресов
              через личный кабинет или обратиться к администратору кафе для полного
              удаления учётной записи и связанных с ней данных.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

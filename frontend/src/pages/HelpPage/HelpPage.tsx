import { useState } from "react";
import { FaBars, FaQuestionCircle, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import AppBrand from "../../components/common/AppBrand";

const guideSteps = [
  {
    title: "Заповніть профіль",
    text: "Вкажіть вік, вагу, зріст, ціль, активність і кількість тренувань на тиждень. На цих даних будується персональна програма.",
  },
  {
    title: "Сформуйте програму",
    text: "У кабінеті натисніть кнопку формування програми. Сервіс підготує тренування і харчування під вашу ціль.",
  },
  {
    title: "Ведіть прогрес",
    text: "Додавайте заміри ваги, талії, кроки, сон, енергію і виконані тренування. Так легше бачити реальні зміни.",
  },
  {
    title: "Питайте AI-помічника",
    text: "У вкладці чату можна уточнити вправи, заміни продуктів, режим тренувань або попросити пояснити план простіше.",
  },
];

const featureCards = [
  {
    title: "Тренування",
    text: "Показує тижні, дні та вправи з підходами і повтореннями. Починайте з першого тижня і рухайтесь послідовно.",
  },
  {
    title: "Харчування",
    text: "Містить прийоми їжі, продукти, грамування і калорії. Якщо продукт не підходить, попросіть AI запропонувати заміну.",
  },
  {
    title: "Прогрес",
    text: "Допомагає порівнювати показники за день, тиждень або місяць. Додавайте заміри регулярно, бажано в один час.",
  },
  {
    title: "Чат",
    text: "Зберігає діалоги з помічником. Можна створювати нові чати для окремих питань: тренування, харчування або мотивація.",
  },
];

const faqs = [
  {
    question: "Чому програма не формується?",
    answer:
      "Перевірте, чи заповнений профіль. Якщо профіль є, зачекайте кілька секунд і спробуйте ще раз. Також програма може бути заблокована до наступного оновлення, якщо її вже створено на 4 тижні.",
  },
  {
    question: "Як змінити ціль або вагу?",
    answer:
      "Перейдіть у профіль, оновіть дані і збережіть. Після зміни ключових параметрів у кабінеті можна сформувати новий актуальний план, коли оновлення буде доступне.",
  },
  {
    question: "Що робити, якщо вправа не підходить?",
    answer:
      "Напишіть у чаті, яка вправа викликає проблему і яке обладнання у вас є. AI-помічник запропонує безпечнішу або зручнішу заміну.",
  },
  {
    question: "Як правильно додавати прогрес?",
    answer:
      "Записуйте вагу, талію, кроки, сон і самопочуття регулярно. Один замір за день достатній, головне не пропускати довгі періоди.",
  },
  {
    question: "Чи можна користуватись без плану харчування?",
    answer:
      "Так. Можна виконувати тренування, вести прогрес і ставити питання в чаті. Харчування допомагає точніше рухатись до цілі, але не блокує інші можливості.",
  },
];

function HelpPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="sticky top-0 z-30 mb-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_30px_rgba(59,130,246,0.08)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <AppBrand />

            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={isMenuOpen}
              aria-controls="help-mobile-menu"
            >
              {isMenuOpen ? (
                <FaTimes aria-hidden="true" />
              ) : (
                <FaBars aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="hidden items-center justify-between gap-8 lg:flex">
            <AppBrand />

            <nav className="hidden items-center gap-3 lg:flex">
              <Link
                to="/dashboard"
                className="flex h-10 items-center rounded-xl border border-cyan-500/30 bg-slate-900 px-4 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-slate-800"
              >
                Кабінет
              </Link>

              <Link
                to="/profile"
                className="flex h-10 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Профіль
              </Link>
            </nav>
          </div>

          <div
            id="help-mobile-menu"
            className={`grid transition-[grid-template-rows,opacity] duration-200 lg:hidden ${
              isMenuOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <nav className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-slate-900 px-4 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-slate-800"
                >
                  Кабінет
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Профіль
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <section className="mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
              Допомога
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Як користуватись програмою
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Тут зібрані основні кроки, пояснення розділів і відповіді на
              часті питання, щоб швидко розібратись із кабінетом.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
                <FaQuestionCircle aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Швидка підказка
                </p>
                <p className="mt-1 text-sm leading-6 text-cyan-100/90">
                  Якщо щось незрозуміло у плані, відкрийте чат і запитайте
                  простими словами.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold">Швидкий старт</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {guideSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-sm font-bold text-violet-100">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold">Основні розділи</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold">Часті питання</h2>
          <div className="mt-4 grid gap-3">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 open:border-cyan-500/30 open:bg-cyan-500/10"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-white">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-cyan-300 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h2 className="text-xl font-bold">Готові повернутись до плану?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Відкрийте кабінет, перегляньте сьогоднішній день і зафіксуйте
              прогрес після тренування.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:mt-0"
          >
            До кабінету
          </Link>
        </section>
      </div>
    </div>
  );
}

export default HelpPage;

import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden rounded-[32px] border border-cyan-500/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.20),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.22),_transparent_34%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))] px-5 py-10 shadow-[0_0_60px_rgba(59,130,246,0.08)] sm:px-8 sm:py-14 lg:px-10 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(34,211,238,0.06),transparent)] opacity-40" />

      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative z-10">
          <p className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
            Інтелектуальний фітнес-застосунок
          </p>

          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Сформуй персональний план тренувань і харчування за допомогою ШІ
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Веб-додаток аналізує параметри користувача, його цілі та рівень
            активності й генерує індивідуальні рекомендації для досягнення
            результату.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500 to-violet-500 px-6 text-center font-semibold text-white shadow-[0_0_18px_rgba(34,211,238,0.18)] transition hover:border-cyan-200/40 hover:shadow-[0_0_24px_rgba(34,211,238,0.24)]"
            >
              Спробувати зараз
            </Link>

            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-cyan-500/25 bg-slate-950/45 px-6 text-center font-semibold text-cyan-100 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white"
            >
              Дізнатися більше
            </a>
          </div>
        </div>

        <div className="relative z-10">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />

          <div className="relative mx-auto flex max-w-md items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur">
            <img
              src="/hero-phone.png"
              alt="Демонстрація інтерфейсу FitAI"
              className="w-full rounded-[24px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

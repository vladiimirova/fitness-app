function HowItWorksSection() {
  return (
    <section id="about" className="py-12 sm:py-16">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/70 to-cyan-500/0" />
        <h2 className="text-2xl font-bold sm:text-3xl">Як це працює?</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/0 via-violet-500/70 to-violet-500/0" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* Введення даних */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]">
          
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/icons/input-data.png"
              alt="Input data"
              className="h-[55px] w-[55px] shrink-0 object-contain"
            />

            <p className="text-lg font-semibold leading-tight">
              Введення даних
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Вік, вага, зріст, цілі та рівень активності.
          </p>

        </div>


        {/* Аналіз параметрів */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-violet-400/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]">
          
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/icons/analysis.png"
              alt="Analysis"
              className="h-[55px] w-[55px] shrink-0"
            />

            <p className="text-lg font-semibold leading-tight">
              Аналіз параметрів
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Обробка введених даних та побудова профілю користувача.
          </p>

        </div>


        {/* Генерація плану */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.08)]">
          
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/icons/generation.png"
              alt="Generation"
              className="h-[55px] w-[55px] shrink-0"
            />

            <p className="text-lg font-semibold leading-tight">
              Генерація плану
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Створення персонального плану тренувань і рекомендацій.
          </p>

        </div>


        {/* Відстеження прогресу */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-violet-400/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]">
          
          <div className="flex items-center gap-4 mb-3">
            <img
              src="/icons/progress.png"
              alt="Progress"
              className="h-16 w-16 shrink-0"
            />

            <p className="text-lg font-semibold leading-tight">
              Відстеження прогресу
            </p>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Перегляд результатів, історії та поточного прогресу.
          </p>

        </div>

      </div>
    </section>
  );
}

export default HowItWorksSection;
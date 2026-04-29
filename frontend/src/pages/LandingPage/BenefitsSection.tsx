function BenefitsSection() {
  return (
    <section id="features" className="py-6 sm:py-10">
      
      <div className="mb-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/70 to-cyan-500/0" />
        <h2 className="text-2xl font-bold sm:text-3xl">
          Переваги нашого додатку
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-violet-500/0 via-violet-500/70 to-violet-500/0" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/personalization.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Персоналізація</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-violet-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/auto-plan.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Автоматичні плани</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/ai.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Рекомендації ШІ</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-violet-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/interface.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Зручний інтерфейс</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/prog.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Прогрес та аналітика</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-violet-500/15 bg-white/5 p-6 backdrop-blur">
          <img src="/icons/correction.png" className="w-8 h-8" />
          <p className="text-lg font-semibold">Швидке коригування</p>
        </div>

      </div>
    </section>
  );
}

export default BenefitsSection;
import { useState } from "react";

type DemoSlide = {
  title: string;
  image: string;
  alt: string;
  glow: string;
};

const demoSlides: DemoSlide[] = [
  {
    title: "Панель керування",
    image: "/demo-dashboard.png",
    alt: "Dashboard",
    glow: "hover:border-cyan-400/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]",
  },
  {
    title: "План тренувань",
    image: "/demo-workout.png",
    alt: "План тренувань",
    glow: "hover:border-violet-400/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.12)]",
  },
  {
    title: "План харчування",
    image: "/demo-nutrition.png",
    alt: "План харчування",
    glow: "hover:border-cyan-400/30 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]",
  },
  {
    title: "Прогрес",
    image: "/demo-progress.png",
    alt: "Прогрес",
    glow: "hover:border-violet-400/30 hover:shadow-[0_0_25px_rgba(139,92,246,0.12)]",
  },
];

function DemoSection() {
  const [startIndex, setStartIndex] = useState<number>(0);

  const visibleSlides: DemoSlide[] = [
    demoSlides[startIndex],
    demoSlides[(startIndex + 1) % demoSlides.length],
  ];

  function handlePrev() {
    setStartIndex(function (prev: number) {
      return prev === 0 ? demoSlides.length - 1 : prev - 1;
    });
  }

  function handleNext() {
    setStartIndex(function (prev: number) {
      return (prev + 1) % demoSlides.length;
    });
  }

  function handleDotClick(index: number) {
    setStartIndex(index);
  }

  return (
    <section id="demo" className="py-12 sm:py-16">
      <div className="grid gap-8 xl:grid-cols-[1.45fr_0.9fr] xl:items-start">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <h2 className="shrink-0 text-2xl font-bold sm:text-3xl">
              Демонстрація інтерфейсу
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/70 to-violet-500/10" />
          </div>

          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-300 sm:text-base">
              Переглянь ключові екрани застосунку
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:border-cyan-400/40 hover:bg-white/10"
                aria-label="Попередні слайди"
              >
                ←
              </button>

              <button
                onClick={handleNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:border-violet-400/40 hover:bg-white/10"
                aria-label="Наступні слайди"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {visibleSlides.map(function (slide: DemoSlide) {
              return (
                <div key={slide.title} className="group">
                  <div
                    className={`rounded-[22px] border border-white/10 bg-white/5 p-2 backdrop-blur transition ${slide.glow}`}
                  >
                    <div className="overflow-hidden rounded-[18px] bg-slate-950">
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="h-72 w-full object-contain bg-slate-950 transition duration-300 group-hover:scale-[1.02] sm:h-80 lg:h-[26rem]"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-center text-sm font-medium text-slate-200 sm:text-base">
                    {slide.title}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center gap-3">
            {demoSlides.map(function (_: DemoSlide, index: number) {
              const isActive =
                index === startIndex || index === (startIndex + 1) % demoSlides.length;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={function () {
                    handleDotClick(index);
                  }}
                  aria-label={`Перейти до слайду ${index + 1}`}
                  className={`h-3 w-3 rounded-full transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.45)]"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_35%),radial-gradient(circle_at_center,_rgba(139,92,246,0.16),_transparent_45%),rgba(255,255,255,0.03)] p-5 shadow-[0_0_30px_rgba(34,211,238,0.06)] sm:p-6">
          <h2 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl">
            Інтелектуальна підтримка користувача
          </h2>

          <p className="text-sm leading-7 text-slate-300 sm:text-base">
            Модель аналізує дані користувача, визначає оптимальні напрями
            тренувань та допомагає формувати адаптовані рекомендації для
            досягнення мети.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
            <img
              src="/ai-support.png"
              alt="Інтелектуальна підтримка"
              className="h-[277px] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemoSection;
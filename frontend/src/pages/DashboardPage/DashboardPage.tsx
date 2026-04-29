import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyProfile } from '../../api/profile';
import { generateTrainingPlan, getMyFullTrainingPlan } from '../../api/training';

type ProfileData = {
  id: number;
  userId: number;
  name: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  goal: string;
  activityLevel: string;
  trainingDaysPerWeek: number;
  experienceLevel: string;
} | null;

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
  description: string | null;
  equipment: string | null;
  sets: number;
  reps: number;
};

type DayPlan = {
  dayNumber: number;
  exercises: Exercise[];
};

type WeekPlan = {
  weekNumber: number;
  days: DayPlan[];
};

type FullTrainingPlan = {
  plan: {
    id: number;
    userId: number;
    title: string;
    createdAt: string;
  };
  weeks: WeekPlan[];
} | null;

type DashboardTab = 'training' | 'nutrition' | 'progress';

const avatarStorageKey = 'profileAvatar';
const planDurationDays = 28;
const dayMs = 24 * 60 * 60 * 1000;

function DashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  const [profileData, setProfileData] = useState<ProfileData>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [fullPlan, setFullPlan] = useState<FullTrainingPlan>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('training');

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        const storedAvatar = localStorage.getItem(avatarStorageKey);

        if (storedAvatar) {
          setAvatar(storedAvatar);
        }

        const profile = await getMyProfile(token);
        setProfileData(profile);

        const plan = await getMyFullTrainingPlan(token);
        setFullPlan(plan);

        if (plan?.weeks?.length) {
          setActiveWeek(plan.weeks[0].weekNumber);
        }
      } catch (error) {
        console.error(error);
        setMessage('Не вдалося завантажити дані кабінету');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token, navigate]);

  async function handleGenerateTrainingPlan() {
    if (!canUpdatePlan) {
      setMessage(`План активний ще ${planDaysRemaining} дн. Новий план можна створити після завершення 4 тижнів.`);
      return;
    }

    try {
      setMessage('Генерація плану...');

      await generateTrainingPlan(token);

      const plan = await getMyFullTrainingPlan(token);
      setFullPlan(plan);

      if (plan?.weeks?.length) {
        setActiveWeek(plan.weeks[0].weekNumber);
      }

      setActiveTab('training');
      setMessage('Новий план тренувань успішно створено');
    } catch (error) {
      console.error(error);
      setMessage('Помилка генерації плану тренувань');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  function handleOpenProfile() {
    navigate('/profile');
  }

  function getGoalLabel(goal: string) {
    if (goal === 'gain muscle' || goal === 'gain_muscle') {
      return 'Набір м’язової маси';
    }

    if (goal === 'lose weight' || goal === 'lose_weight') {
      return 'Схуднення';
    }

    if (goal === 'maintain') {
      return 'Підтримка форми';
    }

    return goal;
  }

  function getActivityLabel(activityLevel: string) {
    if (activityLevel === 'low') {
      return 'Низький';
    }

    if (activityLevel === 'medium') {
      return 'Середній';
    }

    if (activityLevel === 'high') {
      return 'Високий';
    }

    return activityLevel;
  }

  function getExperienceLabel(experienceLevel: string) {
    if (experienceLevel === 'beginner') {
      return 'Початковий';
    }

    if (experienceLevel === 'intermediate') {
      return 'Середній';
    }

    if (experienceLevel === 'advanced') {
      return 'Просунутий';
    }

    return experienceLevel;
  }

  function getDailyCalories() {
    if (!profileData) {
      return 0;
    }

    const base =
      profileData.gender === 'male'
        ? 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age + 5
        : 10 * profileData.weight + 6.25 * profileData.height - 5 * profileData.age - 161;

    const activityMultiplier =
      profileData.activityLevel === 'high'
        ? 1.55
        : profileData.activityLevel === 'low'
          ? 1.25
          : 1.4;

    const goalAdjustment =
      profileData.goal === 'lose_weight' || profileData.goal === 'lose weight'
        ? -300
        : profileData.goal === 'gain_muscle' || profileData.goal === 'gain muscle'
          ? 250
          : 0;

    return Math.max(1200, Math.round(base * activityMultiplier + goalAdjustment));
  }

  function getNutritionTargets() {
    const calories = getDailyCalories();
    const protein = profileData ? Math.round(profileData.weight * 1.8) : 0;
    const fat = profileData ? Math.round(profileData.weight * 0.8) : 0;
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

    return {
      calories,
      protein,
      fat,
      carbs,
    };
  }

  function getMealPlan() {
    if (!profileData) {
      return [];
    }

    if (profileData.goal === 'gain_muscle' || profileData.goal === 'gain muscle') {
      return [
        { title: 'Сніданок', text: 'Вівсянка, яйця, фрукти' },
        { title: 'Обід', text: 'Курка або риба, рис, овочі' },
        { title: 'Вечеря', text: 'Творог, салат, цільнозерновий хліб' },
      ];
    }

    if (profileData.goal === 'lose_weight' || profileData.goal === 'lose weight') {
      return [
        { title: 'Сніданок', text: 'Омлет, овочі, тост' },
        { title: 'Обід', text: 'Індичка або риба, гречка, салат' },
        { title: 'Вечеря', text: 'Салат, білкова страва, кефір' },
      ];
    }

    return [
      { title: 'Сніданок', text: 'Каша, йогурт, ягоди' },
      { title: 'Обід', text: 'М’ясо або бобові, крупа, овочі' },
      { title: 'Вечеря', text: 'Риба, овочі, легкий гарнір' },
    ];
  }

  function getPlanDaysRemaining() {
    if (!fullPlan?.plan?.createdAt) {
      return 0;
    }

    const createdAt = new Date(fullPlan.plan.createdAt).getTime();

    if (Number.isNaN(createdAt)) {
      return 0;
    }

    const planEndsAt = createdAt + planDurationDays * dayMs;
    const remaining = Math.ceil((planEndsAt - Date.now()) / dayMs);

    return Math.max(0, remaining);
  }

  function getDayTitle(dayNumber: number) {
    return `День ${dayNumber}`;
  }

  function getInitials(name: string | undefined) {
    if (!name) {
      return 'U';
    }

    return name.trim().charAt(0).toUpperCase();
  }

  function renderAvatar(className: string, imageClassName = 'h-full w-full object-cover') {
    return (
      <div className={className}>
        {avatar ? (
          <img src={avatar} alt="Аватар профілю" className={imageClassName} />
        ) : (
          getInitials(profileData?.name)
        )}
      </div>
    );
  }

  const activeWeekData = useMemo(function () {
    return (
      fullPlan?.weeks.find(function (week) {
        return week.weekNumber === activeWeek;
      }) || null
    );
  }, [fullPlan, activeWeek]);

  const nutritionTargets = getNutritionTargets();
  const mealPlan = getMealPlan();
  const planDaysRemaining = getPlanDaysRemaining();
  const canUpdatePlan = !fullPlan || planDaysRemaining === 0;
  const updatePlanLabel = !fullPlan
    ? 'Сформувати програму'
    : canUpdatePlan
      ? 'Оновити програму'
      : `План активний ${planDaysRemaining} дн.`;
  const updateTrainingLabel = !fullPlan
    ? 'Сформувати план'
    : canUpdatePlan
      ? 'Оновити план'
      : `Доступно через ${planDaysRemaining} дн.`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
              Особистий кабінет
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Панель керування
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="rounded-xl border border-cyan-500/30 bg-slate-900 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-slate-800"
            >
              Головна
            </Link>

            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
              aria-label="Налаштування профілю"
              title="Налаштування профілю"
            >
              {renderAvatar(
                'flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-sm font-bold text-white',
              )}

              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {profileData?.name || 'Профіль'}
                </p>
                <p className="text-xs text-slate-400">Налаштування</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600"
            >
              Вийти
            </button>
          </div>
        </header>

        {message ? (
          <div className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300 backdrop-blur">
            Завантаження даних...
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.16),_transparent_30%),rgba(255,255,255,0.04)] p-6 shadow-[0_0_35px_rgba(34,211,238,0.06)] backdrop-blur sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
                <div>
                  <p className="mb-3 text-sm text-slate-300">
                    Привіт,{' '}
                    <span className="font-semibold text-white">
                      {profileData?.name || 'користувачу'}
                    </span>
                    !
                  </p>

                  <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
                    Персональна програма фітнесу
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    На цій панелі зібрані тренування, орієнтири харчування та
                    поточний прогрес. Дані підлаштовуються під твою ціль,
                    активність і рівень підготовки.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={handleGenerateTrainingPlan}
                      disabled={!canUpdatePlan}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatePlanLabel}
                    </button>

                    {!canUpdatePlan ? (
                      <span className="flex items-center text-sm text-slate-400">
                        Поточний план розрахований на 4 тижні.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Ціль
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getGoalLabel(profileData.goal) : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Активність
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getActivityLabel(profileData.activityLevel) : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Тренувань на тиждень
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.trainingDaysPerWeek || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Рівень
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getExperienceLabel(profileData.experienceLevel) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={function () {
                    setActiveTab('training');
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'training'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Тренування
                </button>

                <button
                  type="button"
                  onClick={function () {
                    setActiveTab('nutrition');
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'nutrition'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Харчування
                </button>

                <button
                  type="button"
                  onClick={function () {
                    setActiveTab('progress');
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'progress'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Прогрес
                </button>

              </div>
            </section>

            {activeTab === 'training' ? (
              <section className="mb-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Мій план тренувань</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {fullPlan?.plan?.title || 'План ще не згенеровано'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateTrainingPlan}
                        disabled={!canUpdatePlan}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
                      >
                        {updateTrainingLabel}
                      </button>

                      {fullPlan?.weeks.map(function (week) {
                        const isActive = week.weekNumber === activeWeek;

                        return (
                          <button
                            key={week.weekNumber}
                            type="button"
                            onClick={function () {
                              setActiveWeek(week.weekNumber);
                            }}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                                : 'border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            Тиждень {week.weekNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!activeWeekData ? (
                    <div className="mt-6 rounded-2xl bg-slate-950/60 p-5 text-sm text-slate-400">
                      План тренувань ще не створено.
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      {activeWeekData.days.map(function (day) {
                        return (
                          <div
                            key={day.dayNumber}
                            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-white">
                                {getDayTitle(day.dayNumber)}
                              </h4>
                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                                {day.exercises.length} вправ
                              </span>
                            </div>

                            <div className="space-y-3">
                              {day.exercises.map(function (exercise) {
                                return (
                                  <div
                                    key={`${day.dayNumber}-${exercise.id}-${exercise.name}`}
                                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-white">
                                          {exercise.name}
                                        </p>
                                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                                          {exercise.muscleGroup}
                                        </p>
                                      </div>

                                      <div className="flex gap-2">
                                        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                                          {exercise.sets} підх.
                                        </span>
                                        <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">
                                          {exercise.reps} повт.
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === 'nutrition' ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                      Харчування
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-white">
                      Денний орієнтир харчування
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                      Рекомендації розраховані за параметрами профілю та
                      поточною ціллю. Це базовий орієнтир для складання меню.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Калорії
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.calories || '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">ккал / день</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Білки
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.protein || '—'} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">відновлення м’язів</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Жири
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.fat || '—'} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">енергія та гормони</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Вуглеводи
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.carbs || '—'} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">паливо для тренувань</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white">Приклад дня</h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {mealPlan.map(function (meal) {
                      return (
                        <div
                          key={meal.title}
                          className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                        >
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {meal.title}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">
                            {meal.text}
                          </p>
                        </div>
                      );
                    })}

                    {!mealPlan.length ? (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400 md:col-span-3">
                        Створи профіль, щоб отримати орієнтир харчування.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'progress' ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                    Прогрес
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    Поточний стан і активність
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                    Тут показані основні показники, за якими можна оцінювати
                    рух до цілі та регулярність тренувань.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Поточна вага
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {profileData?.weight ? `${profileData.weight} кг` : '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        оновлюється через профіль
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Ціль
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {profileData ? getGoalLabel(profileData.goal) : '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        основний напрям програми
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Тренувань
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {profileData?.trainingDaysPerWeek || '—'} / тиждень
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        планова регулярність
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          Тижнева структура
                        </h4>
                        <p className="mt-1 text-sm text-slate-400">
                          План розрахований на 4 тижні з поступовою регулярністю.
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                        {fullPlan?.weeks.length || 0} / 4 тижні
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                      {[1, 2, 3, 4].map(function (weekNumber) {
                        const isReady = Boolean(
                          fullPlan?.weeks.some(function (week) {
                            return week.weekNumber === weekNumber;
                          }),
                        );

                        return (
                          <div
                            key={weekNumber}
                            className={`h-3 rounded-full ${
                              isReady ? 'bg-cyan-400' : 'bg-slate-800'
                            }`}
                            title={`Тиждень ${weekNumber}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;

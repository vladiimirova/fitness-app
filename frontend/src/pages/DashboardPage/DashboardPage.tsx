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

type DashboardTab = 'training' | 'nutrition' | 'progress' | 'profile';

function DashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  const [profileData, setProfileData] = useState<ProfileData>(null);
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

  function getGenderLabel(gender: string) {
    if (gender === 'female') {
      return 'Жіноча';
    }

    if (gender === 'male') {
      return 'Чоловіча';
    }

    return gender;
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

  const activeWeekData = useMemo(function () {
    return (
      fullPlan?.weeks.find(function (week) {
        return week.weekNumber === activeWeek;
      }) || null
    );
  }, [fullPlan, activeWeek]);

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
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-sm font-bold text-white">
                {getInitials(profileData?.name)}
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {profileData?.name || 'Профіль'}
                </p>
                <p className="text-xs text-slate-400">Редагувати</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              aria-label="Налаштування профілю"
              title="Налаштування профілю"
            >
              ⚙️
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
                  <div className="mb-5 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-2xl font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:scale-[1.02]"
                    >
                      {getInitials(profileData?.name)}
                    </button>

                    <div>
                      <p className="text-sm text-slate-300">
                        Привіт,{' '}
                        <span className="font-semibold text-white">
                          {profileData?.name || 'користувачу'}
                        </span>
                        !
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        Твій персональний кабінет
                      </p>
                    </div>
                  </div>

                  <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
                    Твій місячний план тренувань
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Тут відображається короткий план вправ на 4 тижні без зайвого
                    тексту — тільки дні, вправи та кількість підходів і повторень.
                    Далі сюди ж додамо харчування, прогрес та редагування профілю.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={handleGenerateTrainingPlan}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Оновити план
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Редагувати профіль
                    </button>
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

                <button
                  type="button"
                  onClick={function () {
                    setActiveTab('profile');
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                      : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Профіль
                </button>
              </div>
            </section>

            {activeTab === 'training' ? (
              <section className="mb-8 grid gap-6 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur lg:col-span-1">
                  <div className="mb-5 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-lg font-bold text-white"
                    >
                      {getInitials(profileData?.name)}
                    </button>

                    <div>
                      <h3 className="text-xl font-semibold">Мій профіль</h3>
                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        className="mt-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                      >
                        Редагувати профіль
                      </button>
                    </div>
                  </div>

                  {!profileData ? (
                    <p className="mt-4 text-sm text-slate-400">
                      Профіль ще не створено.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Ім’я</p>
                        <p className="mt-1 font-medium">{profileData.name}</p>
                      </div>

                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Вік</p>
                        <p className="mt-1 font-medium">{profileData.age}</p>
                      </div>

                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Вага</p>
                        <p className="mt-1 font-medium">{profileData.weight} кг</p>
                      </div>

                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Зріст</p>
                        <p className="mt-1 font-medium">{profileData.height} см</p>
                      </div>

                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Стать</p>
                        <p className="mt-1 font-medium">
                          {getGenderLabel(profileData.gender)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950/70 p-3">
                        <p className="text-xs text-slate-400">Ціль</p>
                        <p className="mt-1 font-medium">
                          {getGoalLabel(profileData.goal)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur lg:col-span-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Мій план тренувань</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {fullPlan?.plan?.title || 'План ще не згенеровано'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                    Харчування
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    Блок харчування буде наступним
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                    Тут ми додамо денний план їжі, прийоми їжі, калорії,
                    білки, жири, вуглеводи та можливість генерувати меню
                    відповідно до параметрів користувача.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Сніданок
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Скоро буде доступно
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Обід
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Скоро буде доступно
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Вечеря
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Скоро буде доступно
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'progress' ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="max-w-3xl">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                    Прогрес
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    Блок прогресу буде додано далі
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                    Тут з’являться вага, заміри, історія тренувань,
                    графіки змін і статистика виконаних занять.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Поточна вага
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {profileData?.weight ? `${profileData.weight} кг` : '—'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Ціль
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {profileData ? getGoalLabel(profileData.goal) : '—'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Статус
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        У розробці
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'profile' ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-5">
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-3xl font-bold text-white"
                    >
                      {getInitials(profileData?.name)}
                    </button>

                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                        Профіль
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        {profileData?.name || 'Користувач'}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Тут можна перейти до редагування особистих параметрів,
                        цілі, активності, рівня та кількості тренувань.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Редагувати профіль
                  </button>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Ім’я</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.name || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Вік</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.age || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Стать</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getGenderLabel(profileData.gender) : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Вага</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.weight ? `${profileData.weight} кг` : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Зріст</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.height ? `${profileData.height} см` : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Ціль</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getGoalLabel(profileData.goal) : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Активність</p>
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
                    <p className="text-xs uppercase tracking-wide text-slate-400">Рівень</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getExperienceLabel(profileData.experienceLevel) : '—'}
                    </p>
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
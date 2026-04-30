import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateMyAiProgram, getMyAiProgram } from "../../api/ai";
import { getMyProfile } from "../../api/profile";

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

type DashboardTab = "training" | "nutrition" | "progress";

type MealIngredient = {
  name: string;
  grams: number;
  calories: number;
};

type MealItem = {
  title: string;
  text: string;
  ingredients: MealIngredient[];
};

type MealDayPlan = {
  dayNumber: number;
  meals: MealItem[];
};

type NutritionWeekPlan = {
  weekNumber: number;
  days: MealDayPlan[];
};

type AiProgramResponse = {
  source?: {
    ai?: string;
    savedProgramId?: number;
    savedAt?: string;
  };
  foodLookup?: Array<{
    id: number;
    name: string;
  }>;
  exerciseLookup?: Array<{
    id: number;
    name: string;
    muscleGroup: string;
    equipment: string;
  }>;
  program?: {
    trainingPlan?: {
      title?: string;
      days?: Array<{
        dayNumber: number;
        focus?: string;
        exercises?: Array<{
          exerciseId?: number;
          name?: string;
          muscleGroup?: string;
          equipment?: string | null;
          sets: number;
          reps: number;
        }>;
      }>;
    };
    nutritionPlan?: {
      days?: Array<{
        dayNumber: number;
        meals?: Array<{
          mealType?: string;
          dishName?: string;
          foods?: Array<{
            foodId?: number;
            name?: string;
            grams: number;
            calories?: number;
          }>;
        }>;
      }>;
    };
  };
};

const avatarStorageKey = "profileAvatar";

function DashboardPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const [profileData, setProfileData] = useState<ProfileData>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [fullPlan, setFullPlan] = useState<FullTrainingPlan>(null);
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("training");
  const [activeNutritionWeek, setActiveNutritionWeek] = useState<number>(1);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionWeekPlan[]>([]);
  const [isGeneratingProgram, setIsGeneratingProgram] =
    useState<boolean>(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const storedAvatar = localStorage.getItem(avatarStorageKey);

        if (storedAvatar) {
          setAvatar(storedAvatar);
        }

        const results = await Promise.allSettled([
          getMyProfile(token),
          getMyAiProgram(token),
        ]);

        if (results[0].status === "fulfilled") {
          const profile = results[0].value;
          setProfileData(profile);
        } else {
          console.error(results[0].reason);
          setMessage("Не вдалося завантажити профіль");
        }

        if (results[1].status === "fulfilled" && results[1].value) {
          applyAiProgram(results[1].value);
        } else if (results[1].status === "rejected") {
          console.error(results[1].reason);
        }
      } catch (error) {
        console.error(error);
        setMessage("Не вдалося завантажити дані кабінету");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token, navigate]);

  async function handleGenerateProgram() {
    if (isGeneratingProgram) {
      return;
    }

    try {
      setIsGeneratingProgram(true);
      setMessage("Генерація програми...");
      let hasAiNutrition = false;

      try {
        const aiProgram = await generateMyAiProgram(token);
        const applied = applyAiProgram(aiProgram);
        if (applied.hasNutrition) {
          hasAiNutrition = true;
        } else {
          setMessage("AI не повернув план харчування");
        }
      } catch (aiError) {
        console.error(aiError);
        setNutritionPlan([]);
        setMessage(
          aiError instanceof Error
            ? `AI сервіс: ${aiError.message}`
            : "AI сервіс недоступний: план харчування не згенеровано",
        );
      }
      setActiveNutritionWeek(1);
      setActiveTab("training");
      if (hasAiNutrition) {
        setMessage("Програму оновлено: тренування і харчування сформовано");
      }
    } catch (error) {
      console.error(error);
      setMessage("Помилка генерації програми");
    } finally {
      setIsGeneratingProgram(false);
    }
  }

  function applyAiProgram(aiProgram: AiProgramResponse) {
    const aiTraining = buildTrainingPlanFromAiProgram(aiProgram);
    const aiNutrition = buildNutritionPlanFromAiProgram(aiProgram);

    setFullPlan(aiTraining);

    if (aiTraining?.weeks?.length) {
      setActiveWeek(aiTraining.weeks[0].weekNumber);
    }

    if (aiNutrition.length) {
      setNutritionPlan(aiNutrition);
    } else {
      setNutritionPlan([]);
    }

    return {
      hasTraining: Boolean(aiTraining?.weeks?.length),
      hasNutrition: Boolean(aiNutrition.length),
    };
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function handleOpenProfile() {
    navigate("/profile");
  }

  function getGoalLabel(goal: string) {
    if (goal === "gain muscle" || goal === "gain_muscle") {
      return "Набір м’язової маси";
    }

    if (goal === "lose weight" || goal === "lose_weight") {
      return "Схуднення";
    }

    if (goal === "maintain") {
      return "Підтримка форми";
    }

    return goal;
  }

  function getActivityLabel(activityLevel: string) {
    if (activityLevel === "low") {
      return "Низький";
    }

    if (activityLevel === "medium") {
      return "Середній";
    }

    if (activityLevel === "high") {
      return "Високий";
    }

    return activityLevel;
  }

  function getExperienceLabel(experienceLevel: string) {
    if (experienceLevel === "beginner") {
      return "Початковий";
    }

    if (experienceLevel === "intermediate") {
      return "Середній";
    }

    if (experienceLevel === "advanced") {
      return "Просунутий";
    }

    return experienceLevel;
  }

  function getDailyCalories() {
    if (!profileData) {
      return 0;
    }

    const base =
      profileData.gender === "male"
        ? 10 * profileData.weight +
          6.25 * profileData.height -
          5 * profileData.age +
          5
        : 10 * profileData.weight +
          6.25 * profileData.height -
          5 * profileData.age -
          161;

    const activityMultiplier =
      profileData.activityLevel === "high"
        ? 1.55
        : profileData.activityLevel === "low"
          ? 1.25
          : 1.4;

    const goalAdjustment =
      profileData.goal === "lose_weight" || profileData.goal === "lose weight"
        ? -300
        : profileData.goal === "gain_muscle" ||
            profileData.goal === "gain muscle"
          ? 250
          : 0;

    return Math.max(
      1200,
      Math.round(base * activityMultiplier + goalAdjustment),
    );
  }

  function getNutritionTargets() {
    const calories = getDailyCalories();
    const protein = profileData ? Math.round(profileData.weight * 1.8) : 0;
    const fat = profileData ? Math.round(profileData.weight * 0.8) : 0;
    const carbs = Math.max(
      0,
      Math.round((calories - protein * 4 - fat * 9) / 4),
    );

    return {
      calories,
      protein,
      fat,
      carbs,
    };
  }

  function getMealWeight(meal: MealItem) {
    return meal.ingredients.reduce(
      (total, ingredient) => total + ingredient.grams,
      0,
    );
  }

  function getIngredientCalories(ingredient: MealIngredient) {
    return Math.max(0, Math.round(Number(ingredient.calories) || 0));
  }

  function getMealCalories(meal: MealItem) {
    return meal.ingredients.reduce(function (total, ingredient) {
      return total + getIngredientCalories(ingredient);
    }, 0);
  }

  function getDayTitle(dayNumber: number) {
    return `День ${dayNumber}`;
  }

  function getInitials(name: string | undefined) {
    if (!name) {
      return "U";
    }

    return name.trim().charAt(0).toUpperCase();
  }

  function renderAvatar(
    className: string,
    imageClassName = "h-full w-full object-cover",
  ) {
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

  const activeWeekData = useMemo(
    function () {
      return (
        fullPlan?.weeks.find(function (week) {
          return week.weekNumber === activeWeek;
        }) || null
      );
    },
    [fullPlan, activeWeek],
  );

  const activeNutritionWeekData = useMemo(
    function () {
      return (
        nutritionPlan.find(function (week) {
          return week.weekNumber === activeNutritionWeek;
        }) || null
      );
    },
    [nutritionPlan, activeNutritionWeek],
  );

  const nutritionTargets = getNutritionTargets();
  const updatePlanLabel = isGeneratingProgram
    ? "Генерація..."
    : fullPlan
      ? "Оновити програму"
      : "Сформувати програму";
  const updateTrainingLabel = isGeneratingProgram
    ? "Генерація..."
    : fullPlan
      ? "Оновити план"
      : "Сформувати план";

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
                "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-sm font-bold text-white",
              )}

              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {profileData?.name || "Профіль"}
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
                    Привіт,{" "}
                    <span className="font-semibold text-white">
                      {profileData?.name || "користувачу"}
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
                      onClick={handleGenerateProgram}
                      disabled={isGeneratingProgram}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatePlanLabel}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Ціль
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData ? getGoalLabel(profileData.goal) : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Активність
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData
                        ? getActivityLabel(profileData.activityLevel)
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Тренувань на тиждень
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData?.trainingDaysPerWeek || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Рівень
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {profileData
                        ? getExperienceLabel(profileData.experienceLevel)
                        : "—"}
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
                    setActiveTab("training");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "training"
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  Тренування
                </button>

                <button
                  type="button"
                  onClick={function () {
                    setActiveTab("nutrition");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "nutrition"
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  Харчування
                </button>

                <button
                  type="button"
                  onClick={function () {
                    setActiveTab("progress");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "progress"
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  Прогрес
                </button>
              </div>
            </section>

            {activeTab === "training" ? (
              <section className="mb-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        Мій план тренувань
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {fullPlan?.plan?.title || "План ще не згенеровано"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateProgram}
                        disabled={isGeneratingProgram}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                                ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white"
                                : "border border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800"
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
                              <div>
                                <h4 className="text-lg font-semibold text-white">
                                  {getDayTitle(day.dayNumber)}
                                </h4>
                                <p className="mt-1 text-xs text-slate-400">
                                  {day.exercises.reduce(
                                    (total, exercise) => total + exercise.sets,
                                    0,
                                  )}{" "}
                                  підходів загалом
                                </p>
                              </div>
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
                                        <p className="mt-2 text-xs text-slate-500">
                                          {exercise.equipment ||
                                            "Без обладнання"}
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

            {activeTab === "nutrition" ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                      Харчування
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-white">
                      Орієнтир харчування на 4 тижні
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                      Рекомендації розраховані за параметрами профілю та
                      поточною ціллю. Денна норма лишається орієнтиром для
                      кожного дня плану.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Калорії
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.calories || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">ккал / день</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Білки
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.protein || "—"} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      відновлення м’язів
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Жири
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.fat || "—"} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      енергія та гормони
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Вуглеводи
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {nutritionTargets.carbs || "—"} г
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      паливо для тренувань
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      План харчування на 4 тижні
                    </h4>

                    {nutritionPlan.length ? (
                      <div className="flex flex-wrap gap-2">
                        {nutritionPlan.map(function (week) {
                          const isActive =
                            week.weekNumber === activeNutritionWeek;

                          return (
                            <button
                              key={week.weekNumber}
                              type="button"
                              onClick={function () {
                                setActiveNutritionWeek(week.weekNumber);
                              }}
                              className={
                                isActive
                                  ? "rounded-xl border border-cyan-400 bg-cyan-400/15 px-3 py-2 text-sm font-semibold text-cyan-100"
                                  : "rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
                              }
                            >
                              Тиждень {week.weekNumber}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  {!activeNutritionWeekData ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
                      Створи профіль, щоб отримати орієнтир харчування.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {activeNutritionWeekData.days.map(function (day) {
                        return (
                          <div
                            key={day.dayNumber}
                            className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                          >
                            <p className="text-xs uppercase tracking-wide text-cyan-300">
                              День {day.dayNumber}
                            </p>

                            <div className="mt-4 space-y-4">
                              {day.meals.map(function (meal) {
                                return (
                                  <div
                                    key={`${day.dayNumber}-${meal.title}`}
                                    className="rounded-xl bg-slate-900/70 p-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                          {meal.title}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-100">
                                          {meal.text}
                                        </p>
                                      </div>

                                      <div className="flex gap-2">
                                        <span className="rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                                          {getMealWeight(meal)} г
                                        </span>
                                        <span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">
                                          {getMealCalories(meal)} ккал
                                        </span>
                                      </div>
                                    </div>

                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                      {meal.ingredients.map(
                                        function (ingredient) {
                                          return (
                                            <div
                                              key={`${day.dayNumber}-${meal.title}-${ingredient.name}`}
                                              className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2"
                                            >
                                              <span className="text-sm text-slate-300">
                                                {ingredient.name}
                                              </span>
                                              <span className="shrink-0 text-right text-sm font-semibold text-white">
                                                {ingredient.grams} г
                                                <span className="ml-2 text-xs font-normal text-slate-400">
                                                  {getIngredientCalories(
                                                    ingredient,
                                                  )}{" "}
                                                  ккал
                                                </span>
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
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

                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Вага вказана для сирого або готового продукту згідно з
                    назвою: “варений рис”, “варена гречка”, “овочі”.
                  </p>
                </div>
              </section>
            ) : null}

            {activeTab === "progress" ? (
              <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-400/80">
                    Прогрес
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    Поточний стан і активність
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                    Тут показані основні показники, за якими можна оцінювати рух
                    до цілі та регулярність тренувань.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Поточна вага
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {profileData?.weight ? `${profileData.weight} кг` : "—"}
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
                        {profileData ? getGoalLabel(profileData.goal) : "—"}
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
                        {profileData?.trainingDaysPerWeek || "—"} / тиждень
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
                          План розрахований на 4 тижні з поступовою
                          регулярністю.
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
                              isReady ? "bg-cyan-400" : "bg-slate-800"
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

function buildTrainingPlanFromAiProgram(
  data: AiProgramResponse,
): FullTrainingPlan {
  const days = data.program?.trainingPlan?.days ?? [];
  const title = data.program?.trainingPlan?.title ?? "AI план тренувань";
  const exerciseLookup = new Map(
    (data.exerciseLookup ?? []).map((item) => [item.id, item]),
  );

  if (!days.length) {
    return null;
  }

  const weekDays = [...days]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((aiDay, dayIndex) => {
      const dayNumber = aiDay.dayNumber || dayIndex + 1;
      const exercises = (aiDay.exercises ?? []).map(
        (exercise, exerciseIndex) => {
          const found =
            typeof exercise.exerciseId === "number"
              ? exerciseLookup.get(exercise.exerciseId)
              : undefined;
          const id = exercise.exerciseId ?? dayNumber * 100 + exerciseIndex + 1;
          return {
            id,
            name: exercise.name ?? found?.name ?? `Вправа #${id}`,
            muscleGroup:
              exercise.muscleGroup ??
              found?.muscleGroup ??
              aiDay?.focus ??
              "Загальна підготовка",
            description: null,
            equipment: exercise.equipment ?? found?.equipment ?? null,
            sets: Math.max(1, Math.round(exercise.sets)),
            reps: Math.max(1, Math.round(exercise.reps)),
          };
        },
      );

      return {
        dayNumber,
        exercises,
      };
    });

  const weeks = Array.from({ length: 4 }, function (_, weekIndex) {
    return {
      weekNumber: weekIndex + 1,
      days: weekDays.map((day) => ({
        dayNumber: day.dayNumber,
        exercises: day.exercises.map((exercise) => ({ ...exercise })),
      })),
    };
  });

  return {
    plan: {
      id: 0,
      userId: 0,
      title,
      createdAt: new Date().toISOString(),
    },
    weeks,
  };
}

function buildNutritionPlanFromAiProgram(
  data: AiProgramResponse,
): NutritionWeekPlan[] {
  const days = data.program?.nutritionPlan?.days ?? [];
  const foodLookup = new Map(
    (data.foodLookup ?? []).map((item) => [item.id, item.name]),
  );

  if (!days.length) {
    return [];
  }

  const usedDishNames = new Set<string>();
  const allDays = Array.from({ length: 28 }, function (_, dayIndex) {
    const dayNumber = dayIndex + 1;
    const aiDay = days.find((item) => item.dayNumber === dayNumber);

    const seenMealTypes = new Set<string>();
    const sortedMeals = [...(aiDay?.meals ?? [])].sort((a, b) => {
      return getMealTypeOrder(a.mealType) - getMealTypeOrder(b.mealType);
    });

    const meals = sortedMeals
      .filter((meal) => {
        const key = normalizeMealType(meal.mealType);
        if (seenMealTypes.has(key)) {
          return false;
        }
        seenMealTypes.add(key);
        return true;
      })
      .map((meal) => {
        const mealType = normalizeMealType(meal.mealType);
        const ingredients = (meal.foods ?? []).map((food) => ({
          name:
            food.name ??
            (food.foodId ? foodLookup.get(food.foodId) : undefined) ??
            "Інгредієнт",
          grams: Math.max(1, Math.round(food.grams)),
          calories: Math.max(0, Math.round(Number(food.calories) || 0)),
        }));

        const dishName = meal.dishName?.trim() ?? "";
        const fallbackDishName = pickPleasantDishName(mealType, dayNumber);
        const rawDishName =
          isValidHumanDishName(dishName) && !looksLikeIngredientList(dishName)
            ? dishName
            : fallbackDishName;
        const finalDishName = makeUniqueDishName(
          rawDishName,
          mealType,
          dayNumber,
          usedDishNames,
        );

        return {
          title: finalDishName,
          text: ingredients.length
            ? ingredients.map((item) => item.name).join(", ")
            : "Склад не вказано",
          ingredients,
        };
      });

    return {
      dayNumber,
      meals,
    };
  });

  return Array.from({ length: 4 }, (_, weekIndex) => {
    const start = weekIndex * 7;
    const weekDays = allDays.slice(start, start + 7);

    return {
      weekNumber: weekIndex + 1,
      days: weekDays.map((day, dayIndex) => ({
        dayNumber: dayIndex + 1,
        meals: day.meals.map((meal) => ({
          ...meal,
          ingredients: meal.ingredients.map((ingredient) => ({
            ...ingredient,
          })),
        })),
      })),
    };
  });
}

function isValidHumanDishName(value: string) {
  const normalized = value.trim();
  return normalized.length >= 4 && normalized.length <= 64;
}

function looksLikeIngredientList(value: string) {
  const normalized = value.toLowerCase();
  const forbiddenTokens = [
    "сніданок",
    "обід",
    "вечеря",
    "перекус",
    ",",
    " + ",
    ";",
  ];
  return forbiddenTokens.some((token) => normalized.includes(token));
}

function normalizeMealType(value: string | undefined) {
  const normalized = value?.toLowerCase().trim() ?? "";

  if (["breakfast", "lunch", "dinner", "snack"].includes(normalized)) {
    return normalized;
  }

  return "snack";
}

function getMealTypeOrder(value: string | undefined) {
  const orderedMealTypes = ["breakfast", "lunch", "dinner", "snack"];
  const index = orderedMealTypes.indexOf(normalizeMealType(value));

  return index === -1 ? orderedMealTypes.length : index;
}

function pickPleasantDishName(mealType: string, dayNumber: number) {
  const byType: Record<string, string[]> = {
    breakfast: [
      "Йогуртовий боул з ягодами",
      "Омлет з сиром і зеленню",
      "Вівсянка з фруктами та горіхами",
      "Сирники з ягідним топінгом",
    ],
    lunch: [
      "Курка теріякі з рисом",
      "Паста з тунцем і томатами",
      "Індичка з гречкою та овочами",
      "Теплий боул з куркою та броколі",
    ],
    dinner: [
      "Лосось з овочами на грилі",
      "Тефтелі з індички з гарніром",
      "Риба з картоплею та салатом",
      "Овочеве рагу з квасолею",
    ],
    snack: [
      "Творожний десерт з ягодами",
      "Йогурт з горіхами",
      "Фруктовий смузі",
      "Легкий протеїновий перекус",
    ],
  };

  const items = byType[mealType?.toLowerCase()] ?? ["Домашня страва"];
  return items[dayNumber % items.length];
}

function makeUniqueDishName(
  baseName: string,
  mealType: string,
  dayNumber: number,
  usedDishNames: Set<string>,
) {
  const normalized = baseName.trim();

  if (!usedDishNames.has(normalized)) {
    usedDishNames.add(normalized);
    return normalized;
  }

  const variants = [
    `${normalized} з травами`,
    `${normalized} у легкому соусі`,
    `${normalized} по-домашньому`,
    `${normalized} зі спеціями`,
    `${normalized} по-середземноморськи`,
    pickPleasantDishName(mealType, dayNumber + 11),
  ];

  for (const candidate of variants) {
    if (!usedDishNames.has(candidate)) {
      usedDishNames.add(candidate);
      return candidate;
    }
  }

  const numbered = `${normalized} #${dayNumber}`;
  usedDishNames.add(numbered);
  return numbered;
}

export default DashboardPage;

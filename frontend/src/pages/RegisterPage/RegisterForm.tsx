import type { ChangeEvent } from "react";
import type { LoginFormData, ProfileFormData } from "../../types";

type RegisterFormProps = {
  form: LoginFormData;
  profileForm: ProfileFormData;
  saving: boolean;
  onAuthChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProfileChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onSubmit: () => void;
};

function RegisterForm({
  form,
  profileForm,
  saving,
  onAuthChange,
  onProfileChange,
  onSubmit,
}: RegisterFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex w-full flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Реєстрація</h1>
        <p className="mt-2 text-sm text-slate-400">
          Створіть акаунт і одразу заповніть анкету для персонального плану.
        </p>
      </div>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Дані входу
        </h2>

        <input
          id="register-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Введіть email"
          value={form.email}
          onChange={onAuthChange}
          required
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 sm:text-base"
        />

        <input
          id="register-password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Введіть пароль"
          value={form.password}
          onChange={onAuthChange}
          required
          minLength={6}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 sm:text-base"
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Анкета профілю
        </h2>

        <label>
          <span className="text-sm text-slate-300">Ім’я</span>
          <input
            name="name"
            value={profileForm.name}
            onChange={onProfileChange}
            required
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm text-slate-300">Вік</span>
            <input
              type="number"
              name="age"
              min="12"
              max="100"
              value={profileForm.age}
              onChange={onProfileChange}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="text-sm text-slate-300">Стать</span>
            <select
              name="gender"
              value={profileForm.gender}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="female">Жіноча</option>
              <option value="male">Чоловіча</option>
            </select>
          </label>

          <label>
            <span className="text-sm text-slate-300">Вага, кг</span>
            <input
              type="number"
              name="weight"
              min="30"
              max="300"
              value={profileForm.weight}
              onChange={onProfileChange}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="text-sm text-slate-300">Бажана вага, кг</span>
            <input
              type="number"
              name="targetWeight"
              value={profileForm.targetWeight}
              onChange={onProfileChange}
              placeholder={
                profileForm.goal === "lose_weight"
                  ? "Менше поточної"
                  : profileForm.goal === "gain_muscle"
                    ? "Більше поточної"
                    : "Майже як поточна"
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="text-sm text-slate-300">Зріст, см</span>
            <input
              type="number"
              name="height"
              min="100"
              max="250"
              value={profileForm.height}
              onChange={onProfileChange}
              required
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
            />
          </label>

          <label>
            <span className="text-sm text-slate-300">Ціль</span>
            <select
              name="goal"
              value={profileForm.goal}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="lose_weight">Схуднення</option>
              <option value="gain_muscle">Набір м’язової маси</option>
              <option value="maintain">Підтримка форми</option>
            </select>
          </label>

          <label>
            <span className="text-sm text-slate-300">Активність</span>
            <select
              name="activityLevel"
              value={profileForm.activityLevel}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="low">Низька</option>
              <option value="medium">Середня</option>
              <option value="high">Висока</option>
            </select>
          </label>

          <label>
            <span className="text-sm text-slate-300">
              Тренувань на тиждень
            </span>
            <select
              name="trainingDaysPerWeek"
              value={profileForm.trainingDaysPerWeek}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>

          <label>
            <span className="text-sm text-slate-300">Рівень</span>
            <select
              name="experienceLevel"
              value={profileForm.experienceLevel}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="beginner">Початковий</option>
              <option value="intermediate">Середній</option>
              <option value="advanced">Просунутий</option>
            </select>
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
      >
        {saving ? "Створення профілю..." : "Зареєструватися"}
      </button>
    </form>
  );
}

export default RegisterForm;

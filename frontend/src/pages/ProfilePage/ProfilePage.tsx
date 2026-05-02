import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createProfile,
  getMyProfile,
  updateMyProfile,
} from "../../api/profile";
import type { ProfileFormData, ProfilePayload, UserProfile } from "../../types";

const defaultForm: ProfileFormData = {
  name: "",
  age: "",
  weight: "",
  targetWeight: "",
  height: "",
  gender: "female",
  goal: "lose_weight",
  activityLevel: "medium",
  trainingDaysPerWeek: "3",
  experienceLevel: "beginner",
};

const avatarStorageKey = "profileAvatar";

function ProfilePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const [form, setForm] = useState<ProfileFormData>(defaultForm);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);

        const storedAvatar = localStorage.getItem(avatarStorageKey);

        const data = await getMyProfile(token);
        setProfile(data);

        if (data) {
          const nextAvatar = data.avatarUrl || storedAvatar || "";

          setAvatar(nextAvatar);
          if (nextAvatar) {
            localStorage.setItem(avatarStorageKey, nextAvatar);
          }

          setForm({
            name: data.name,
            age: String(data.age),
            weight: String(data.weight),
            targetWeight: data.targetWeight ? String(data.targetWeight) : "",
            height: String(data.height),
            gender: data.gender,
            goal: data.goal,
            activityLevel: data.activityLevel,
            trainingDaysPerWeek: String(data.trainingDaysPerWeek),
            experienceLevel: data.experienceLevel,
          });
        } else if (storedAvatar) {
          setAvatar(storedAvatar);
        }
      } catch (error) {
        console.error(error);
        setMessage("Не вдалося завантажити профіль");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate, token]);

  const initials = useMemo(() => {
    return form.name.trim().charAt(0).toUpperCase() || "U";
  }, [form.name]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const result = await resizeAvatar(String(reader.result || ""));
      setAvatar(result);
      localStorage.setItem(avatarStorageKey, result);
    };

    reader.readAsDataURL(file);
  }

  function buildPayload(nextAvatar: string): ProfilePayload {
    return {
      name: form.name.trim(),
      age: Number(form.age),
      weight: Number(form.weight),
      targetWeight: form.targetWeight ? Number(form.targetWeight) : null,
      height: Number(form.height),
      gender: form.gender,
      goal: form.goal,
      activityLevel: form.activityLevel,
      trainingDaysPerWeek: Number(form.trainingDaysPerWeek),
      experienceLevel: form.experienceLevel,
      avatarUrl: nextAvatar || null,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const validationMessage = getTargetWeightValidationMessage(
        Number(form.weight),
        form.targetWeight ? Number(form.targetWeight) : null,
        form.goal,
      );

      if (validationMessage) {
        setMessage(validationMessage);
        return;
      }

      const normalizedAvatar = avatar ? await resizeAvatar(avatar) : "";
      setAvatar(normalizedAvatar);
      if (normalizedAvatar) {
        localStorage.setItem(avatarStorageKey, normalizedAvatar);
      }

      const payload = buildPayload(normalizedAvatar);
      const savedProfile = profile
        ? await updateMyProfile(token, payload)
        : await createProfile(token, payload);

      setProfile(savedProfile);
      if (savedProfile.avatarUrl) {
        setAvatar(savedProfile.avatarUrl);
        localStorage.setItem(avatarStorageKey, savedProfile.avatarUrl);
      } else {
        localStorage.removeItem(avatarStorageKey);
      }
      localStorage.setItem("profileUpdatedAt", String(Date.now()));
      setMessage("Профіль успішно збережено");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Помилка збереження профілю",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400/80">
              Налаштування
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Профіль користувача
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="w-fit rounded-xl border border-cyan-500/30 bg-slate-900 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400 hover:bg-slate-800"
          >
            До особистого кабінету
          </Link>
        </header>

        <div className="mb-6 min-h-14">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm transition ${
              message
                ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100 opacity-100"
                : "pointer-events-none border-transparent bg-transparent text-transparent opacity-0"
            }`}
            aria-live="polite"
          >
            {message}
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            Завантаження профілю...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6 lg:grid-cols-[0.8fr_1.2fr]"
          >
            <section className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-4xl font-bold text-white">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Аватар профілю"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <label className="mt-5 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                  Змінити аватар
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm text-slate-300">Ім’я</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Вік</span>
                <input
                  type="number"
                  name="age"
                  min="12"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Стать</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400"
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
                  value={form.weight}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">
                  Бажана вага, кг
                </span>
                <input
                  type="number"
                  name="targetWeight"
                  value={form.targetWeight}
                  onChange={handleChange}
                  placeholder={
                    form.goal === "lose_weight"
                      ? "Менше поточної"
                      : form.goal === "gain_muscle"
                        ? "Більше поточної"
                      : "Майже як поточна"
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Зріст, см</span>
                <input
                  type="number"
                  name="height"
                  min="100"
                  max="250"
                  value={form.height}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Ціль</span>
                <select
                  name="goal"
                  value={form.goal}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400"
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
                  value={form.activityLevel}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400"
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
                  value={form.trainingDaysPerWeek}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400"
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
                  value={form.experienceLevel}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="beginner">Початковий</option>
                  <option value="intermediate">Середній</option>
                  <option value="advanced">Просунутий</option>
                </select>
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:col-span-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Збереження..." : "Зберегти профіль"}
                </button>

                <Link
                  to="/dashboard"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Скасувати
                </Link>
              </div>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}

function resizeAvatar(dataUrl: string) {
  return new Promise<string>((resolve) => {
    const image = new Image();

    image.onload = () => {
      const maxSize = 512;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(dataUrl);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function getTargetWeightValidationMessage(
  weight: number,
  targetWeight: number | null,
  goal: string,
) {
  if (targetWeight === null) {
    return "";
  }

  if (!Number.isFinite(targetWeight) || targetWeight <= 0) {
    if (goal === "lose_weight") {
      return "Для схуднення бажана вага має бути меншою за поточну";
    }

    if (goal === "gain_muscle") {
      return "Для набору маси бажана вага має бути більшою за поточну";
    }

    return "Для підтримки форми бажана вага має бути близькою до поточної";
  }

  if (goal === "lose_weight" && targetWeight >= weight) {
    return "Для схуднення бажана вага має бути меншою за поточну";
  }

  if (goal === "gain_muscle" && targetWeight <= weight) {
    return "Для набору маси бажана вага має бути більшою за поточну";
  }

  if (goal === "maintain" && Math.abs(targetWeight - weight) > 2) {
    return "Для підтримки форми бажана вага має бути близькою до поточної";
  }

  return "";
}

export default ProfilePage;

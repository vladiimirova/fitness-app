import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/auth";
import { createProfile } from "../../api/profile";
import type {
  LoginFormData,
  ProfileFormData,
  ProfilePayload,
} from "../../types";
import RegisterForm from "./RegisterForm";

const defaultProfileForm: ProfileFormData = {
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

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [profileForm, setProfileForm] =
    useState<ProfileFormData>(defaultProfileForm);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function handleAuthChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm(function (prev) {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleProfileChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setMessage("");

      const validationMessage = validateRegistrationForm(form, profileForm);

      if (validationMessage) {
        setMessage(validationMessage);
        return;
      }

      await registerUser(form.email.trim(), form.password);
      const loginData = await loginUser(form.email.trim(), form.password);

      if (!loginData.access_token) {
        setMessage(
          loginData.message || "Акаунт створено, але вхід не виконано",
        );
        return;
      }

      localStorage.setItem("token", loginData.access_token);
      await createProfile(
        loginData.access_token,
        buildProfilePayload(profileForm),
      );
      localStorage.setItem("profileUpdatedAt", String(Date.now()));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Помилка реєстрації");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-3xl">
          <RegisterForm
            form={form}
            profileForm={profileForm}
            saving={saving}
            onAuthChange={handleAuthChange}
            onProfileChange={handleProfileChange}
            onSubmit={handleSubmit}
          />

          {message ? (
            <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
              {message}
            </p>
          ) : null}

          <p className="mt-5 text-center text-sm text-slate-300 sm:text-base">
            Уже маєте акаунт?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function buildProfilePayload(form: ProfileFormData): ProfilePayload {
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
    avatarUrl: null,
  };
}

function validateRegistrationForm(
  authForm: LoginFormData,
  profileForm: ProfileFormData,
) {
  if (!authForm.email.trim()) {
    return "Введіть email";
  }

  if (authForm.password.length < 6) {
    return "Пароль має містити щонайменше 6 символів";
  }

  if (!profileForm.name.trim()) {
    return "Введіть ім’я";
  }

  const age = Number(profileForm.age);
  const weight = Number(profileForm.weight);
  const targetWeight = profileForm.targetWeight
    ? Number(profileForm.targetWeight)
    : null;
  const height = Number(profileForm.height);

  if (!Number.isFinite(age) || age < 12 || age > 100) {
    return "Вік має бути від 12 до 100 років";
  }

  if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
    return "Вага має бути від 30 до 300 кг";
  }

  if (!Number.isFinite(height) || height < 100 || height > 250) {
    return "Зріст має бути від 100 до 250 см";
  }

  return getTargetWeightValidationMessage(
    weight,
    targetWeight,
    profileForm.goal,
  );
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
    return "Бажана вага має бути додатним числом";
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

export default RegisterPage;

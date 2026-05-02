import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";
import type { LoginFormData } from "../../types";
import RegisterForm from "./RegisterForm";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm(function (prev) {
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  async function handleSubmit() {
    try {
      setMessage("");
      const data = await registerUser(form.email, form.password);

      if (data.id) {
        navigate("/login");
        return;
      }

      setMessage(data.message || "Помилка реєстрації");
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Помилка реєстрації");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <RegisterForm
            form={form}
            onChange={handleChange}
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

export default RegisterPage;

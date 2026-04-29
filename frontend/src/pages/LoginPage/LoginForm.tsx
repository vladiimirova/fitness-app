import type { ChangeEvent } from 'react';
import type { LoginFormData } from '../../types';

type LoginFormProps = {
  form: LoginFormData;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

function LoginForm({ form, onChange, onSubmit }: LoginFormProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20 sm:p-8">
      <h1 className="text-center text-2xl font-semibold sm:text-3xl">
        Вхід
      </h1>

      <input
        type="email"
        name="email"
        placeholder="Введіть email"
        value={form.email}
        onChange={onChange}
        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 sm:text-base"
      />

      <input
        type="password"
        name="password"
        placeholder="Введіть пароль"
        value={form.password}
        onChange={onChange}
        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 sm:text-base"
      />

      <button
        onClick={onSubmit}
        className="mt-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 sm:text-base"
      >
        Увійти
      </button>
    </div>
  );
}

export default LoginForm;
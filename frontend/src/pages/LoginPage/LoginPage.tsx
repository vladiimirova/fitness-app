import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import type { LoginFormData } from '../../types';
import LoginForm from './LoginForm';

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [response, setResponse] = useState('');

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
      const data = await loginUser(form.email, form.password);

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      }

      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(error);
      setResponse('Помилка входу');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-md">
          <LoginForm form={form} onChange={handleChange} onSubmit={handleSubmit} />

          <p className="mt-5 text-center text-sm text-slate-300 sm:text-base">
            Немає акаунта?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              Зареєструватися
            </Link>
          </p>

          <pre className="mt-5 whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-200 shadow-lg shadow-black/20 sm:text-sm">
            {response}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
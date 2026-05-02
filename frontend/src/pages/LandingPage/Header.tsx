import { Link } from "react-router-dom";

function Header() {
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  return (
    <header className="sticky top-0 z-30 mb-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.08)] sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-400/30 to-violet-500/30 text-lg font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.25)]">
            F
          </div>

          <div>
            <p className="text-2xl font-bold tracking-wide">
              Fit<span className="text-cyan-400">AI</span>
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-slate-200">
          <a href="#home" className="transition hover:text-cyan-300">
            Головна
          </a>
          <a href="#about" className="transition hover:text-cyan-300">
            Про проєкт
          </a>
          <a href="#features" className="transition hover:text-cyan-300">
            Функції
          </a>
          <a href="#demo" className="transition hover:text-cyan-300">
            Демо
          </a>
          <a href="#contacts" className="transition hover:text-cyan-300">
            Контакти
          </a>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition hover:opacity-90"
            >
              До кабінету
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
              >
                Увійти
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition hover:opacity-90"
              >
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import AppBrand from "../../components/common/AppBrand";

function Header() {
  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "#home", label: "Головна" },
    { href: "#about", label: "Про проєкт" },
    { href: "#features", label: "Функції" },
    { href: "#demo", label: "Демо" },
    { href: "#contacts", label: "Контакти" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 mb-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.08)] sm:px-6">
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <div className="flex items-center gap-3">
          <AppBrand />
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
          aria-label={isMenuOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={isMenuOpen}
          aria-controls="landing-mobile-menu"
        >
          {isMenuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>

      <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-8">
        <AppBrand />

        <nav className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/45 p-1 text-sm text-slate-200">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 font-medium transition hover:bg-cyan-400/10 hover:text-cyan-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <HeaderActions isAuthenticated={isAuthenticated} onNavigate={closeMenu} />
      </div>

      <div
        id="landing-mobile-menu"
        className={`grid transition-[grid-template-rows,opacity] duration-200 lg:hidden ${
          isMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 border-t border-white/10 pt-4">
            <nav className="flex flex-col gap-1 text-sm text-slate-200">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-cyan-300"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-4">
              <HeaderActions
                isAuthenticated={isAuthenticated}
                onNavigate={closeMenu}
                isMobile
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

type HeaderActionsProps = {
  isAuthenticated: boolean;
  isMobile?: boolean;
  onNavigate: () => void;
};

function HeaderActions({
  isAuthenticated,
  isMobile = false,
  onNavigate,
}: HeaderActionsProps) {
  const wrapperClassName = isMobile
    ? "flex flex-col gap-3 sm:flex-row"
    : "flex items-center gap-3";

  return (
    <div className={wrapperClassName}>
      {isAuthenticated ? (
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition hover:opacity-90"
        >
          До кабінету
        </Link>
      ) : (
        <>
          <Link
            to="/login"
            onClick={onNavigate}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-white/10"
          >
            Увійти
          </Link>

          <Link
            to="/register"
            onClick={onNavigate}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-center text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition hover:opacity-90"
          >
            Реєстрація
          </Link>
        </>
      )}
    </div>
  );
}

export default Header;

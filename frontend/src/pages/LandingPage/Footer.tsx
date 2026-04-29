import { FaTelegramPlane, FaInstagram, FaYoutube, FaGithub } from "react-icons/fa";

function Footer() {
  return (
    <footer
      id="contacts"
      className="mt-16 rounded-[28px] border border-white/10 bg-white/5 px-6 py-10 backdrop-blur sm:px-10"
    >
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <a href="#home" className="text-2xl font-bold">
            Fit<span className="text-cyan-400">AI</span>
          </a>

          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            Розумний підхід до тренувань, здоров’я та індивідуального прогресу.
          </p>
        </div>

        <div>
          <p className="text-lg font-semibold">Навігація</p>

          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>
              <a href="#home" className="transition hover:text-cyan-400">
                Головна
              </a>
            </li>

            <li>
              <a href="#about" className="transition hover:text-cyan-400">
                Про проєкт
              </a>
            </li>

            <li>
              <a href="#features" className="transition hover:text-cyan-400">
                Функції
              </a>
            </li>

            <li>
              <a href="#demo" className="transition hover:text-cyan-400">
                Демо
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-lg font-semibold">Контакти</p>

          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>
              <a
                href="mailto:fitai@gmail.com"
                className="hover:text-cyan-400 transition"
              >
                fitai@gmail.com
              </a>
            </li>

            <li>
              <a
                href="tel:+380671234567"
                className="hover:text-cyan-400 transition"
              >
                +38 (067) 123 45 67
              </a>
            </li>
          </ul>

          <div className="mt-5 flex items-center gap-4 text-xl">
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-cyan-400 hover:text-cyan-400"
            >
              <FaTelegramPlane />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-pink-400 hover:text-pink-400"
            >
              <FaInstagram />
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-red-400 hover:text-red-400"
            >
              <FaYoutube />
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:border-violet-400 hover:text-violet-400"
            >
              <FaGithub />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
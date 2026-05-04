import { Link } from "react-router-dom";

function AppBrand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      aria-label="На головну"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-400/30 to-violet-500/30 text-lg font-bold text-white shadow-[0_0_25px_rgba(34,211,238,0.25)]">
        F
      </div>

      <p className="text-2xl font-bold tracking-wide">
        Fit<span className="text-cyan-400">AI</span>
      </p>
    </Link>
  );
}

export default AppBrand;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ?? "Trop de tentatives de connexion. Réessayez plus tard.",
        );
        return;
      }

      if (!res.ok) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      await refresh();
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#181820] border border-white/[0.06]">
        <button
          type="button"
          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#E50914] text-white shadow-md"
        >
          Connexion
        </button>
        <Link
          to="/register"
          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#9CA3AF] hover:text-white flex items-center justify-center"
        >
          Inscription
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#9CA3AF]">
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@reelverse.gg"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#E50914]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#9CA3AF]">
              Mot de passe
            </label>
            <span
              className="text-[11px] font-semibold text-[#9CA3AF]/40 cursor-not-allowed"
              title="Bientôt disponible"
            >
              Mot de passe oublié ?
            </span>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#E50914]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting
            ? "Connexion en cours..."
            : "Se connecter & Ouvrir mes Packs"}
        </button>
      </form>

      <div className="relative flex items-center justify-center py-1">
        <div className="border-t border-white/[0.08] w-full" />
        <span className="bg-[#121217] px-3 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] whitespace-nowrap">
          Ou continuer avec
        </span>
        <div className="border-t border-white/[0.08] w-full" />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="py-2.5 px-3 rounded-xl bg-[#181820] border border-white/10 text-xs font-bold text-[#9CA3AF]/50 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5L1.6 17c1.9 3.9 5.8 7 10.4 7z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="py-2.5 px-3 rounded-xl bg-[#181820] border border-white/10 text-xs font-bold text-[#9CA3AF]/50 flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            <span>Discord</span>
          </button>
        </div>

        <div className="w-full py-2 px-3 rounded-xl bg-[#181820]/40 border border-white/[0.05] text-[11px] font-semibold text-[#9CA3AF]/60 flex items-center justify-between">
          <span>Connexion avec Apple</span>
          <span className="px-2 py-0.5 rounded bg-[#22222C] text-[9px] font-bold uppercase text-[#9CA3AF]">
            Bientôt disponible
          </span>
        </div>
      </div>
    </AuthLayout>
  );
}
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { AuthLayout } from "./AuthLayout";

export function ResetPasswordPage() {
  const { token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue. Réessaie plus tard.");
        return;
      }

      setDone(true);
    } catch {
      setError("Impossible de joindre le serveur. Réessaie plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Mot de passe mis à jour. Tu peux te connecter.</span>
        </div>
        <Link
          to="/login"
          className="block w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 text-white font-black text-xs uppercase tracking-wider text-center shadow-lg"
        >
          Aller à la connexion
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-1">
        <h2 className="text-lg font-black text-[#F3F4F6]">
          Nouveau mot de passe
        </h2>
        <p className="text-xs text-[#9CA3AF]">
          Choisis un mot de passe d'au moins 8 caractères.
        </p>
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
            Nouveau mot de passe
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
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

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#9CA3AF]">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#E50914]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "Mise à jour..." : "Changer mon mot de passe"}
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à la connexion</span>
      </Link>
    </AuthLayout>
  );
}

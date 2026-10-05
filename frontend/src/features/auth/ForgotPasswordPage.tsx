import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "./AuthLayout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue. Réessaie plus tard.");
        return;
      }

      setMessage(
        data?.message ??
          "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.",
      );
    } catch {
      setError("Impossible de joindre le serveur. Réessaie plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-1">
        <h2 className="text-lg font-black text-[#F3F4F6]">
          Mot de passe oublié
        </h2>
        <p className="text-xs text-[#9CA3AF]">
          Entre ton adresse e-mail, tu recevras un lien pour choisir un nouveau
          mot de passe.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
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

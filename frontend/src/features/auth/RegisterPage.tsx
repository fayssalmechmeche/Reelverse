import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erreur lors de l'inscription.");
        return;
      }

      navigate("/login");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#181820] border border-white/[0.06]">
        <Link
          to="/login"
          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#9CA3AF] hover:text-white flex items-center justify-center"
        >
          Connexion
        </Link>
        <button
          type="button"
          className="py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#E50914] text-white shadow-md"
        >
          Inscription
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#F3F4F6]">
              Pseudo unique de collectionneur
            </label>
            <span className="text-[10px] font-bold text-[#F59E0B]">
              Public & Unique
            </span>
          </div>
          <div className="relative">
            <User className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: Kubrick_Archive"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#E50914]"
            />
          </div>
          <p className="text-[10px] text-[#9CA3AF]">
            Ce pseudo permettra à vos amis de vous trouver et d'inspecter votre
            vitrine.
          </p>
        </div>

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
              placeholder="votre@email.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF]/50 focus:outline-none focus:border-[#E50914]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#9CA3AF]">
            Mot de passe (min. 8 caractères)
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting
            ? "Création du compte..."
            : "Créer mon compte & Recevoir mes Packs"}
        </button>
      </form>
    </AuthLayout>
  );
}

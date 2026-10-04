import { useState } from "react";
import { KeyRound, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useChangePassword } from "./useChangePassword";

export function SettingsTab() {
  const { logout } = useAuth();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err: Error) => setError(err.message),
      },
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-4">
        <h3 className="text-sm font-black text-[#F3F4F6] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#F59E0B]" />
          <span>Changer de mot de passe</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#9CA3AF]">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#9CA3AF]">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#9CA3AF]">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
              <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Mot de passe mis à jour avec succès.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
          >
            {changePassword.isPending
              ? "Mise à jour..."
              : "Mettre à jour le mot de passe"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
        <h3 className="text-sm font-black text-[#F3F4F6]">Session</h3>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2.5 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-white/10 text-xs font-bold text-[#F3F4F6] flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </section>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  UserRound,
  Camera,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMe } from "../auth/useMe";
import { Avatar } from "../../components/Avatar";
import { useChangePassword } from "./useChangePassword";
import {
  useUpdateUsername,
  useUploadAvatar,
  useDeleteAvatar,
} from "./useUpdateProfile";

export function SettingsTab() {
  const { logout, refresh } = useAuth();
  const changePassword = useChangePassword();

  const { data: me } = useMe();
  const updateUsername = useUpdateUsername();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (me?.username) setUsername(me.username);
  }, [me?.username]);

  function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    updateUsername.mutate(username.trim(), {
      onSuccess: () => {
        setProfileSuccess("Pseudo mis à jour.");
        refresh();
      },
      onError: (err: Error) => setProfileError(err.message),
    });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProfileError(null);
    setProfileSuccess(null);
    uploadAvatar.mutate(file, {
      onSuccess: () => {
        setProfileSuccess("Photo de profil mise à jour.");
        refresh();
      },
      onError: (err: Error) => setProfileError(err.message),
    });
  }

  function handleAvatarDelete() {
    setProfileError(null);
    setProfileSuccess(null);
    deleteAvatar.mutate(undefined, {
      onSuccess: () => {
        setProfileSuccess("Photo de profil supprimée.");
        refresh();
      },
      onError: (err: Error) => setProfileError(err.message),
    });
  }

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
          <UserRound className="w-4 h-4 text-[#F59E0B]" />
          <span>Profil</span>
        </h3>

        <div className="flex items-center gap-4">
          <Avatar
            src={me?.avatarUrl}
            name={me?.username ?? ""}
            className="w-20 h-20 text-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="px-3.5 py-2 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-white/10 text-xs font-bold text-[#F3F4F6] flex items-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>
                {uploadAvatar.isPending ? "Envoi..." : "Changer la photo"}
              </span>
            </button>
            {me?.avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={deleteAvatar.isPending}
                className="px-3.5 py-2 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-white/10 text-xs font-bold text-[#9CA3AF] flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-3 max-w-md">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#9CA3AF]">Pseudo</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#181820] border border-white/10 text-xs text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          {profileError && (
            <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
              <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={
              updateUsername.isPending || username.trim() === me?.username
            }
            className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-2 border-red-950 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
          >
            {updateUsername.isPending ? "Mise à jour..." : "Changer le pseudo"}
          </button>
        </form>
      </section>

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
              minLength={8}
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
              minLength={8}
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
            {changePassword.isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
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
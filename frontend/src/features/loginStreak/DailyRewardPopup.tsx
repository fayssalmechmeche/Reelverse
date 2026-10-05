import { useEffect, useState } from "react";
import { Gift, Coins, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useClaimLoginStreak, useLoginStreak } from "./useLoginStreak";

/** Date locale du jour au format YYYY-MM-DD. */
function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function storageKey(userId: number) {
  return `reelverse:daily-reward-popup:${userId}`;
}

function alreadyShownToday(userId: number) {
  try {
    return localStorage.getItem(storageKey(userId)) === todayKey();
  } catch {
    return false;
  }
}

function markShownToday(userId: number) {
  try {
    localStorage.setItem(storageKey(userId), todayKey());
  } catch {
    // Stockage indisponible : le popup pourra réapparaître, sans gravité.
  }
}

/**
 * Rappelle une fois par jour à l'utilisateur de récupérer sa récompense de
 * connexion. S'il ferme le popup sans la récupérer, il ne réapparaît pas avant
 * le lendemain (la récompense reste disponible depuis son profil).
 */
export function DailyRewardPopup() {
  const { user } = useAuth();
  const { data } = useLoginStreak();
  const claimStreak = useClaimLoginStreak();
  const [open, setOpen] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;
  const claimable = data?.claimable ?? false;

  useEffect(() => {
    if (userId == null || !claimable) return;
    if (alreadyShownToday(userId)) return;
    markShownToday(userId);
    setOpen(true);
  }, [userId, claimable]);

  if (!open || !data) return null;

  function handleClaim() {
    setError(null);
    claimStreak.mutate(undefined, {
      onSuccess: (res) => setClaimedReward(res.coinsReward),
      onError: (err: Error) => setError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#121217] border border-[#F59E0B]/40 p-6 space-y-5 text-center shadow-[0_0_40px_rgba(245,158,11,0.15)]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-[#181820] text-[#9CA3AF] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {claimedReward !== null ? (
          <>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#F3F4F6]">
                Récompense récupérée
              </h2>
              <p className="text-sm text-[#9CA3AF] flex items-center justify-center gap-1.5">
                <span>+{claimedReward}</span>
                <Coins className="w-4 h-4 text-[#F59E0B]" />
                <span>ajoutés à ton solde.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-3 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-white/10 text-[#F3F4F6] font-black text-xs uppercase tracking-wider"
            >
              Super
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center">
              <Gift className="w-7 h-7 text-[#F59E0B]" />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                Jour {data.currentDay} / 7
              </div>
              <h2 className="text-xl font-black text-[#F3F4F6]">
                Ta récompense du jour t'attend
              </h2>
              <p className="text-sm text-[#9CA3AF] flex items-center justify-center gap-1.5">
                <span>Récupère</span>
                <span className="font-black text-[#F3F4F6]">
                  {data.coinsReward}
                </span>
                <Coins className="w-4 h-4 text-[#F59E0B]" />
                <span>en te connectant aujourd'hui.</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              {data.rewards.map((item) => (
                <span
                  key={item.day}
                  className={`h-1.5 w-6 rounded-full ${
                    item.day < data.currentDay
                      ? "bg-[#F59E0B]/50"
                      : item.day === data.currentDay
                        ? "bg-[#F59E0B]"
                        : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6] text-left">
                <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleClaim}
                disabled={claimStreak.isPending}
                className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#f6121d] border-b-4 border-red-950 active:translate-y-0.5 text-white font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-50"
              >
                {claimStreak.isPending
                  ? "Récupération..."
                  : "Récupérer ma récompense"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-2 text-xs font-semibold text-[#9CA3AF] hover:text-white"
              >
                Plus tard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

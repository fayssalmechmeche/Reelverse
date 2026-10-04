import { useState } from "react";
import {
  Trophy,
  Lock,
  CheckCircle2,
  Coins,
  Loader2,
  AlertCircle,
  Gift,
  Sparkles,
  Calendar,
  X,
} from "lucide-react";
import { useAchievements } from "./useAchievements";
import { useQuests, useClaimQuest, type QuestData } from "../quests/useQuests";
import {
  useLoginStreak,
  useClaimLoginStreak,
} from "../loginStreak/useLoginStreak";

type QuestTab = "ALL" | "DAILY" | "WEEKLY" | "ACHIEVEMENTS" | "COLLECTIONS";

const TABS: { id: QuestTab; label: string }[] = [
  { id: "ALL", label: "Tout" },
  { id: "DAILY", label: "Quotidiennes" },
  { id: "WEEKLY", label: "Hebdo" },
  { id: "ACHIEVEMENTS", label: "Succès" },
  { id: "COLLECTIONS", label: "Collections 100%" },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-6 flex flex-col items-center text-center gap-2">
      <Sparkles className="w-5 h-5 text-[#9CA3AF]" />
      <h2 className="text-sm font-black text-[#F3F4F6]">{title}</h2>
      <p className="text-xs text-[#9CA3AF] max-w-sm">
        Bientôt disponible. Cette partie n'est pas encore branchée.
      </p>
    </section>
  );
}

function QuestRow({
  quest,
  onClaim,
  isClaiming,
}: {
  quest: QuestData;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

  return (
    <div className="p-3.5 rounded-xl bg-[#181820] border border-white/[0.06] space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#F3F4F6]">
            {quest.label}
          </h3>
          <p className="text-[11px] text-[#9CA3AF]">{quest.description}</p>
        </div>

        {quest.claimed ? (
          <span className="px-2.5 py-1 rounded-lg bg-[#121217] text-[11px] font-bold text-[#9CA3AF] shrink-0">
            Récupéré ✓
          </span>
        ) : quest.readyToClaim ? (
          <button
            type="button"
            onClick={onClaim}
            disabled={isClaiming}
            className="px-3 py-1.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white font-bold text-xs uppercase shrink-0 disabled:opacity-50"
          >
            Récupérer +{quest.coinsReward}
          </button>
        ) : (
          <span className="text-xs font-bold text-[#F59E0B] shrink-0">
            +{quest.coinsReward} Coins
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="w-full h-1.5 bg-[#121217] rounded-full overflow-hidden">
          <div className="h-full bg-[#E50914]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[10px] font-bold text-[#9CA3AF] shrink-0">
          {quest.progress}/{quest.target}
        </span>
      </div>
    </div>
  );
}

function QuestSection({
  title,
  period,
}: {
  title: string;
  period: "daily" | "weekly";
}) {
  const { data: quests = [], isLoading, error } = useQuests();
  const claimQuest = useClaimQuest();
  const [claimError, setClaimError] = useState<string | null>(null);

  const periodQuests = quests.filter((q) => q.period === period);

  function handleClaim(questId: number) {
    setClaimError(null);
    claimQuest.mutate(questId, {
      onError: (err: Error) => setClaimError(err.message),
    });
  }

  return (
    <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
      <h2 className="text-sm font-black text-[#F3F4F6]">{title}</h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>Impossible de charger les quêtes.</span>
        </div>
      ) : periodQuests.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">
          Aucune quête disponible pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {claimError && <p className="text-[#F87171] text-xs">{claimError}</p>}
          {periodQuests.map((quest) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              onClaim={() => handleClaim(quest.id)}
              isClaiming={claimQuest.isPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LoginStreakModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading, error } = useLoginStreak();
  const claimStreak = useClaimLoginStreak();
  const [claimError, setClaimError] = useState<string | null>(null);

  function handleClaim() {
    setClaimError(null);
    claimStreak.mutate(undefined, {
      onError: (err: Error) => setClaimError(err.message),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#121217] border border-white/15 p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Récompense de connexion quotidienne</span>
            </div>
            <h2 className="text-xl font-black text-[#F3F4F6] mt-1">
              {data
                ? `Série en cours : Jour ${data.currentDay} / 7`
                : "Chargement..."}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#181820] text-[#9CA3AF] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
            <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
            <span>Impossible de charger la récompense de connexion.</span>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {data.rewards.map((item) => {
                const isPast = item.day < data.currentDay;
                const isClaimedToday =
                  item.day === data.currentDay && !data.claimable;
                const isClaimed = isPast || isClaimedToday;
                const isToday = item.day === data.currentDay;
                const isMilestone = item.day === 7;

                return (
                  <div
                    key={item.day}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 ${
                      isMilestone ? "col-span-3 sm:col-span-2" : ""
                    } ${
                      isToday && !isClaimed
                        ? "bg-[#181820] border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                        : isClaimed
                          ? "bg-[#181820]/40 border-white/5 opacity-60"
                          : "bg-[#181820]/80 border-white/10"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-[#9CA3AF]">
                      Jour {item.day}
                    </span>
                    <div className="font-black text-sm text-[#F59E0B] flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />+{item.coinsReward}
                    </div>
                    <span className="text-[10px] font-bold text-[#F3F4F6]">
                      {isClaimed
                        ? "Récupéré ✓"
                        : isToday
                          ? "Aujourd'hui"
                          : "À venir"}
                    </span>
                  </div>
                );
              })}
            </div>

            {claimError && (
              <p className="text-[#F87171] text-xs">{claimError}</p>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              {data.claimable ? (
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claimStreak.isPending}
                  className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white text-xs font-black uppercase disabled:opacity-50"
                >
                  Récupérer +{data.coinsReward} Coins
                </button>
              ) : (
                <span className="text-xs font-bold text-[#9CA3AF]">
                  Revenez demain pour le jour suivant.
                </span>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function AchievementsScreen() {
  const { data: achievements = [], isLoading, error } = useAchievements();
  const [tab, setTab] = useState<QuestTab>("ALL");
  const [showLoginStreakModal, setShowLoginStreakModal] = useState(false);
  const { data: loginStreak } = useLoginStreak();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const achievementsSection = (
    <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-[#F3F4F6]">Succès Permanents</h2>
        <span className="text-[11px] font-bold text-[#9CA3AF]">
          {unlockedCount} / {achievements.length} débloqués
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-[#9CA3AF] text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40 flex items-center gap-2 text-xs text-[#F3F4F6]">
          <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>Impossible de charger les succès.</span>
        </div>
      ) : achievements.length === 0 ? (
        <p className="text-xs text-[#9CA3AF]">
          Aucun succès disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl p-3.5 border flex items-center gap-3 transition-all ${
                a.unlocked
                  ? "bg-[#181820] border-[#F59E0B]/30"
                  : "bg-[#181820]/60 border-white/[0.06]"
              }`}
            >
              <div
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border ${
                  a.unlocked
                    ? "bg-[#F59E0B]/15 border-[#F59E0B]/40"
                    : "bg-[#121217] border-white/10"
                }`}
              >
                {a.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#71717A]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3
                  className={`text-xs sm:text-sm font-bold ${
                    a.unlocked ? "text-[#F3F4F6]" : "text-[#9CA3AF]"
                  }`}
                >
                  {a.label}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FBBF24]">
                    <Coins className="w-3 h-3" />+{a.coinsReward} Coins
                  </span>
                  {a.unlocked && a.unlockedAt && (
                    <span className="text-[10px] text-[#71717A]">
                      Débloqué le{" "}
                      {new Date(a.unlockedAt).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-[#F59E0B]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#F3F4F6]">Quêtes & Succès</h2>
          <p className="text-[11px] text-[#9CA3AF]">
            {unlockedCount} / {achievements.length} succès débloqués
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                tab === t.id
                  ? "bg-[#E50914] border-[#E50914] text-white"
                  : "bg-[#181820] border-white/[0.08] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowLoginStreakModal(true)}
          title="Récompense de connexion quotidienne (Calendrier 7 jours)"
          className="relative px-3 py-1.5 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-[#F59E0B]/40 text-xs font-bold text-[#F3F4F6] flex items-center gap-1.5"
        >
          <Gift className="w-4 h-4 text-[#F59E0B]" />
          <span>
            Calendrier 7 Jours
            {loginStreak ? ` (J${loginStreak.currentDay})` : ""}
          </span>
          {loginStreak?.claimable && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
          )}
        </button>
      </div>

      {showLoginStreakModal && (
        <LoginStreakModal onClose={() => setShowLoginStreakModal(false)} />
      )}

      <div className="space-y-4">
        {(tab === "ALL" || tab === "DAILY") && (
          <QuestSection title="Quêtes Quotidiennes (24h)" period="daily" />
        )}

        {(tab === "ALL" || tab === "WEEKLY") && (
          <QuestSection title="Quêtes Hebdomadaires (7j)" period="weekly" />
        )}

        {(tab === "ALL" || tab === "ACHIEVEMENTS") && achievementsSection}

        {(tab === "ALL" || tab === "COLLECTIONS") && (
          <ComingSoon title="Récompenses de Collections complétées à 100%" />
        )}
      </div>
    </div>
  );
}

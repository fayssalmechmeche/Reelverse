import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layers, Trophy, Users, Settings } from "lucide-react";
import { useMe } from "../auth/useMe";
import { useFriendsData } from "../social/useFriends";
import { AchievementsScreen } from "../achievements/AchievementsScreen";
import { SocialScreen } from "../social/SocialScreen";
import { SettingsTab } from "../settings/SettingsTab";
import { VitrineTab } from "../collection/VitrineTab";

type ProfileTab = "VITRINE" | "QUESTS" | "SOCIAL" | "SETTINGS";

const PROFILE_TAB_FROM_PARAM: Record<string, ProfileTab> = {
  vitrine: "VITRINE",
  quests: "QUESTS",
  social: "SOCIAL",
  settings: "SETTINGS",
};

const PROFILE_TAB_TO_PARAM: Record<ProfileTab, string> = {
  VITRINE: "vitrine",
  QUESTS: "quests",
  SOCIAL: "social",
  SETTINGS: "settings",
};

const PROFILE_TABS: {
  id: ProfileTab;
  label: string;
  icon: typeof Trophy;
}[] = [
  { id: "VITRINE", label: "Vitrine & Cartes", icon: Layers },
  { id: "QUESTS", label: "Quêtes & Succès", icon: Trophy },
  { id: "SOCIAL", label: "Amis & Social", icon: Users },
  { id: "SETTINGS", label: "Paramètres", icon: Settings },
];

export function ProfileScreen() {
  const { data: me } = useMe();
  const { data: friendsData } = useFriendsData();
  const [searchParams, setSearchParams] = useSearchParams();

  const incomingCount = friendsData?.incoming.length ?? 0;

  const tabParam = searchParams.get("tab") ?? "";
  const [tab, setTab] = useState<ProfileTab>(
    PROFILE_TAB_FROM_PARAM[tabParam] ?? "VITRINE",
  );

  // Permet aux liens externes (ex: bouton Succès dans l'en-tête) de cibler
  // directement un onglet via ?tab=quests, même après le montage initial.
  useEffect(() => {
    const next = PROFILE_TAB_FROM_PARAM[searchParams.get("tab") ?? ""];
    if (next) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function selectTab(next: ProfileTab) {
    setTab(next);
    setSearchParams({ tab: PROFILE_TAB_TO_PARAM[next] });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#181820] border-2 border-[#E50914] flex items-center justify-center font-black text-xl text-[#F3F4F6] shrink-0">
            {(me?.username ?? "").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#F3F4F6]">
              @{me?.username}
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Mon profil</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/[0.06]">
          {PROFILE_TABS.map((t) => {
            const Icon = t.icon;
            const badge =
              t.id === "SOCIAL" && incomingCount > 0
                ? `${incomingCount}`
                : null;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 py-3 sm:py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  tab === t.id
                    ? "bg-[#E50914] border-[#E50914] text-white"
                    : "bg-[#181820] border-white/[0.08] text-[#9CA3AF] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#E50914] text-white text-[9px] font-black border border-[#121217]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {tab === "VITRINE" && <VitrineTab />}
      {tab === "QUESTS" && <AchievementsScreen />}
      {tab === "SOCIAL" && <SocialScreen />}
      {tab === "SETTINGS" && <SettingsTab />}
    </div>
  );
}

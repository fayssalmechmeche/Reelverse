import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Layers,
  Tag,
  ShoppingBag,
  Users,
  Clock,
  Coins,
  LogOut,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useMe } from "../auth/useMe";
import { usePackStock } from "../packs/usePacks";
import { useFriendsData } from "../social/useFriends";
import { DailyRewardPopup } from "../loginStreak/DailyRewardPopup";
import { useClaimableRewards } from "../quests/useClaimableRewards";
import { LegalLinks, TmdbAttribution } from "../legal/LegalPages";

function formatSecondsMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const NAV_ITEMS = [
  { path: "/", label: "Accueil", icon: Package },
  { path: "/collection", label: "Ma Collection", icon: Layers },
  { path: "/marketplace", label: "Marché", icon: Tag },
  { path: "/shop", label: "Boutique du Jour", icon: ShoppingBag },
  { path: "/profile", label: "Profil", icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: me } = useMe();
  const { data: packStock } = usePackStock();
  const { data: friendsData } = useFriendsData();

  const incomingCount = friendsData?.incoming.length ?? 0;

  // Récompenses à récupérer (connexion quotidienne + quêtes terminées)
  const rewardsCount = useClaimableRewards();

  // Countdown local, resynchronisé par le refetch périodique de usePackStock
  const [secondsLeft, setSecondsLeft] = useState(
    packStock?.secondsToNextPack ?? 0,
  );

  useEffect(() => {
    setSecondsLeft(packStock?.secondsToNextPack ?? 0);
  }, [packStock?.secondsToNextPack]);

  useEffect(() => {
    if (!packStock || packStock.storedPacks >= packStock.maxStock) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [packStock]);

  return (
    <div className="bg-[#0B0B0E] min-h-screen text-white pb-16 lg:pb-0">
      {/* BARRE DE NAVIGATION SUPÉRIEURE */}
      <header className="sticky top-0 z-40 bg-[#0B0B0E]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-left group">
              <img
                src="/favicon.svg"
                alt=""
                className="h-9 w-auto shrink-0"
                draggable={false}
              />
              <span className="font-black text-base tracking-tight text-[#F3F4F6] hidden sm:inline">
                REEL<span className="text-[#E50914]">VERSE</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative py-5 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-[#F3F4F6]"
                        : "text-[#9CA3AF] hover:text-[#F3F4F6]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.path === "/profile" && incomingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E50914] text-white">
                        +{incomingCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#E50914] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={() => navigate("/")}
              className="hidden sm:flex items-center gap-3 bg-[#121217] border border-white/[0.08] rounded-xl px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F59E0B]" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#F3F4F6] leading-none">
                    {packStock?.storedPacks ?? 0} / {packStock?.maxStock ?? 10}{" "}
                    <span className="text-[#9CA3AF] font-normal">Packs</span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {packStock &&
                    packStock.storedPacks >= packStock.maxStock ? (
                      <span className="text-[#F59E0B]">MAX</span>
                    ) : (
                      <span>{formatSecondsMMSS(secondsLeft)}</span>
                    )}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/")}
              className="sm:hidden flex items-center gap-1.5 bg-[#121217] border border-white/[0.08] rounded-xl px-2.5 py-1.5"
            >
              <Package className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-[#F3F4F6]">
                {packStock?.storedPacks ?? 0}/{packStock?.maxStock ?? 10}
              </span>
            </button>

            <button
              onClick={() => navigate("/profile?tab=quests")}
              title={
                rewardsCount > 0
                  ? `${rewardsCount} récompense${rewardsCount > 1 ? "s" : ""} à récupérer`
                  : "Voir vos Succès"
              }
              className="relative flex items-center gap-1.5 bg-[#121217] hover:bg-[#181820] border border-white/[0.08] rounded-xl px-2.5 py-1.5"
            >
              <div className="w-4 h-4 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center">
                <Coins className="w-2.5 h-2.5 text-[#F59E0B]" />
              </div>
              <span className="font-bold text-xs text-[#F3F4F6] tracking-tight">
                {(me?.coins ?? 0).toLocaleString("fr-FR")}
              </span>
              {rewardsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] px-1 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-black text-center leading-none border border-[#0B0B0E]">
                  {rewardsCount}
                </span>
              )}
            </button>

            <button
              onClick={logout}
              title="Déconnexion"
              className="p-2 rounded-xl bg-[#121217] hover:bg-[#181820] border border-white/[0.08] text-[#9CA3AF] hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-10 space-y-6">
        {children}
      </main>

      {/* PIED DE PAGE LÉGAL */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-2 border-t border-white/[0.06] pt-5">
        <LegalLinks />
        <TmdbAttribution />
      </footer>

      {/* BARRE DE NAVIGATION INFÉRIEURE MOBILE */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121217]/95 backdrop-blur-md border-t border-white/10 px-1.5 py-2 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComp = item.icon;
          const badge = item.path === "/profile" ? incomingCount : 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                isActive
                  ? "text-[#E50914]"
                  : "text-[#9CA3AF] hover:text-[#F3F4F6]"
              }`}
            >
              <div className="relative">
                <IconComp className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#E50914] text-white text-[9px] font-black">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <DailyRewardPopup />
    </div>
  );
}

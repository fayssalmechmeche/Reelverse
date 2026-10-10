import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LegalLinks, TmdbAttribution } from "../legal/LegalPages";

// Images TMDB en hotlink (l'attribution TMDB est affichée plus bas).
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const PREVIEW_CARDS = {
  left: {
    name: "Rhaenyra Targaryen",
    rarityLabel: "🎭 Epic",
    image: `${TMDB_IMG}/9Zlmb7VmtVCxkLq5yqFFRRxCaED.jpg`,
  },
  center: {
    name: "Tom Holland",
    categoryLabel: "👤 Acteur",
    rarityLabel: "LEGENDARY",
    image: `${TMDB_IMG}/adwEBb2sCSzqwnpVgNEG7irl1Ne.jpg`,
  },
  right: {
    name: "Jon Snow",
    rarityLabel: "🎭 Legendary",
    image: `${TMDB_IMG}/iGXlJbExWwZmo9sUDsYuzf4Sv4y.jpg`,
  },
};

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#0B0B0E] text-[#F3F4F6] font-sans antialiased selection:bg-[#E50914] selection:text-white flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
        <div className="w-[460px] h-[460px] rounded-full bg-[#E50914]/[0.08] blur-3xl -top-24 -left-24 absolute" />
        <div className="w-[360px] h-[360px] rounded-full bg-[#F59E0B]/[0.06] blur-3xl bottom-10 right-10 absolute" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center font-black text-white text-xl tracking-tighter shadow-[0_8px_25px_rgba(229,9,20,0.45)]">
              R
            </div>
            <div className="text-left">
              <span className="font-black text-xl tracking-tight text-[#F3F4F6]">
                REEL<span className="text-[#E50914]">VERSE</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Cinema Collection Game
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#F3F4F6] leading-[1.1]">
              Chaque carte ouvre une{" "}
              <span className="text-[#E50914]">nouvelle collection.</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed max-w-md mx-auto lg:mx-0">
              Un pack gratuit toutes les 10 minutes. Tirez des acteurs, des
              films, des séries et des personnages, puis complétez vos
              collections.
            </p>
          </div>

          <div className="relative flex items-center justify-center lg:justify-start py-4 lg:pl-4">
            <div className="relative flex items-center justify-center h-52 sm:h-56 w-72">
              <div className="absolute left-2 top-3 w-28 sm:w-32 h-44 sm:h-48 rounded-xl bg-[#181820] border border-white/15 -rotate-12 overflow-hidden shadow-2xl">
                <img
                  src={PREVIEW_CARDS.left.image}
                  alt={PREVIEW_CARDS.left.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#181820] via-[#181820]/85 to-transparent text-left p-2 pt-8">
                  <span className="text-[9px] font-bold text-[#C4B5FD] uppercase">
                    {PREVIEW_CARDS.left.rarityLabel}
                  </span>
                  <p className="text-[11px] font-bold text-[#F3F4F6] truncate">
                    {PREVIEW_CARDS.left.name}
                  </p>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#A78BFA]" />
              </div>

              <div className="absolute right-2 top-3 w-28 sm:w-32 h-44 sm:h-48 rounded-xl bg-[#181820] border border-white/15 rotate-12 overflow-hidden shadow-2xl">
                <img
                  src={PREVIEW_CARDS.right.image}
                  alt={PREVIEW_CARDS.right.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#181820] via-[#181820]/85 to-transparent text-left p-2 pt-8">
                  <span className="text-[9px] font-bold text-[#FBBF24] uppercase">
                    {PREVIEW_CARDS.right.rarityLabel}
                  </span>
                  <p className="text-[11px] font-bold text-[#F3F4F6] truncate">
                    {PREVIEW_CARDS.right.name}
                  </p>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#F59E0B]" />
              </div>

              <div className="relative z-10 w-32 sm:w-36 h-48 sm:h-52 rounded-xl bg-[#181820] border-2 border-[#F59E0B]/70 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
                <div className="absolute top-0 inset-x-0 z-10 bg-[#E50914] text-white text-[8px] font-black uppercase tracking-widest py-0.5 text-center">
                  Nouvelle Carte
                </div>
                <img
                  src={PREVIEW_CARDS.center.image}
                  alt={PREVIEW_CARDS.center.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#181820] via-[#181820]/85 to-transparent text-left p-2.5 pt-8">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-[#9CA3AF]">
                      {PREVIEW_CARDS.center.categoryLabel}
                    </span>
                    <span className="font-bold text-[#FBBF24]">
                      {PREVIEW_CARDS.center.rarityLabel}
                    </span>
                  </div>
                  <p className="text-xs font-black text-[#F3F4F6] truncate mt-0.5">
                    {PREVIEW_CARDS.center.name}
                  </p>
                  <div className="w-full h-1 bg-[#22222C] rounded-full mt-1.5 overflow-hidden">
                    <div className="w-3/4 h-full bg-[#E50914]" />
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#F59E0B]" />
              </div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
            <div className="p-3 rounded-xl bg-[#121217] border border-white/[0.06]">
              <div className="text-xs font-black text-[#F59E0B]">
                1 Pack / 10 min
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                Jusqu’à 10 packs en réserve, soit 50 cartes. Toujours gratuit.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#121217] border border-white/[0.06]">
              <div className="text-xs font-black text-[#F3F4F6]">
                Marché & Amis
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                Achetez au prix le plus bas ou échangez entre amis.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#121217] border border-white/[0.06]">
              <div className="text-xs font-black text-[#E50914]">
                Quêtes et succès
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                Relevez des défis chaque jour et complétez vos collections pour
                gagner des Coins.
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 max-w-md w-full mx-auto">
          <div className="rounded-3xl bg-[#121217] border border-white/[0.08] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-5">
            {children}
          </div>

          <div className="mt-4 space-y-3 text-center">
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              En vous connectant ou en créant un compte, vous acceptez les{" "}
              <Link
                to="/terms"
                className="text-[#F3F4F6] underline hover:text-white"
              >
                conditions d’utilisation
              </Link>{" "}
              et la{" "}
              <Link
                to="/privacy"
                className="text-[#F3F4F6] underline hover:text-white"
              >
                politique de confidentialité
              </Link>
              , et confirmez avoir au moins 16 ans.
            </p>
            <LegalLinks className="justify-center" />
            <TmdbAttribution />
          </div>
        </div>
      </div>
    </div>
  );
}

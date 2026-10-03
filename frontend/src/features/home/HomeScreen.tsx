import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, Film, ChevronRight, Repeat } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import { usePackStock, useOpenPack, type DrawnCard } from "../packs/usePacks";
import { useInventory } from "../inventory/useInventory";
import { useMarketplaceListings } from "../marketplace/useMarketplace";
import { useShop } from "../shop/useShop";
import { useFriendsData } from "../social/useFriends";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import { PackRevealModal, type RevealCard } from "../packs/PackRevealModal";
import type { RarityKey } from "../../design/rarity";

const TYPE_META: Record<DrawnCard["type"], { emoji: string; label: string }> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

const RARITY_ORDER: Record<RarityKey, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

function formatSecondsMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { data: packStock } = usePackStock();
  const openPack = useOpenPack();
  const { data: inventory = [] } = useInventory();
  const { data: listings = [] } = useMarketplaceListings();
  const { data: shopCards = [] } = useShop();
  const { data: friendsData } = useFriendsData();

  const [lastDrawn, setLastDrawn] = useState<DrawnCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const resolvedResults = useResolvedCards(
    (lastDrawn ?? []).map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const drawnResolved = useMemo(() => {
    if (!lastDrawn) return null;
    return lastDrawn.map((c, idx) => {
      const info = resolvedResults[idx]?.data;
      const meta = TYPE_META[c.type];
      return {
        ...c,
        name: info?.name ?? `${c.type} #${c.entityId}`,
        subtitle: info?.subtitle ?? "",
        imageUrl: info?.imageUrl ?? null,
        typeEmoji: info?.typeEmoji ?? meta.emoji,
        typeLabel: meta.label,
      };
    });
  }, [lastDrawn, resolvedResults]);

  const uniqueCardsOwned = inventory.filter((c) => c.quantity > 0).length;
  const totalCopiesOwned = inventory.reduce((acc, c) => acc + c.quantity, 0);
  const availableShopCards = shopCards.filter((c) => !c.sold).length;
  const friends = friendsData?.friends ?? [];

  const canOpen = (packStock?.storedPacks ?? 0) > 0;

  function handleOpen() {
    if (!canOpen) return;
    setError(null);
    openPack.mutate(undefined, {
      onSuccess: (data) => {
        // Tri par rareté croissante pour faire monter le suspense pendant la révélation
        const sorted = [...data.cards].sort(
          (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity],
        );
        setLastDrawn(sorted);
        setShowReveal(true);
      },
      onError: (err: Error) => setError(err.message),
    });
  }

  function goToDetail(card: { type: DrawnCard["type"]; entityId: number }) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  return (
    <div className="space-y-6">
      {/* Scène centrale : pack */}
      <section className="relative rounded-3xl bg-[#121217] border border-white/[0.08] p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[320px] h-[320px] rounded-full bg-[#E50914]/10 blur-3xl" />
          <div className="w-[200px] h-[200px] rounded-full bg-[#F59E0B]/10 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1 rounded-full bg-[#181820] border border-white/10 text-[11px]">
            <span className="font-bold text-[#F59E0B] flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>
                {packStock?.storedPacks ?? 0} / {packStock?.maxStock ?? 10}{" "}
                Packs
              </span>
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[#9CA3AF] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-[#E50914]" />
              {packStock && packStock.storedPacks >= packStock.maxStock ? (
                <span className="text-[#F59E0B] font-sans font-semibold">
                  MAX
                </span>
              ) : (
                <span>
                  +1 dans {formatSecondsMMSS(packStock?.secondsToNextPack ?? 0)}
                </span>
              )}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#F3F4F6]">
              Ouvrez vos Packs Cinéma
            </h1>
            <p className="text-xs text-[#9CA3AF] max-w-md mx-auto">
              1 pack gratuit de 5 cartes toutes les 10 minutes. Chaque carte
              ouvre une collection de films, séries, acteurs et personnages.
            </p>
          </div>

          <div
            onClick={handleOpen}
            className="group relative my-1 cursor-pointer select-none"
          >
            <div className="absolute -left-6 top-5 w-40 h-56 rounded-2xl bg-[#181820] border border-white/10 -rotate-12 opacity-60 group-hover:-translate-x-2 transition-all duration-300" />
            <div className="absolute -right-6 top-5 w-40 h-56 rounded-2xl bg-[#181820] border border-white/10 rotate-12 opacity-60 group-hover:translate-x-2 transition-all duration-300" />

            <div className="relative w-56 sm:w-64 h-76 sm:h-80 p-5 rounded-2xl bg-gradient-to-b from-[#22222C] via-[#181820] to-[#121217] border-2 border-white/15 group-hover:border-[#F59E0B] shadow-[0_20px_50px_rgba(0,0,0,0.85)] group-hover:shadow-[0_0_45px_rgba(229,9,20,0.35)] group-hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#9CA3AF]">
                  REELVERSE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[9px] font-black uppercase">
                  5 CARTES
                </span>
              </div>

              <div className="my-auto flex flex-col items-center space-y-2.5">
                <div className="w-20 h-20 rounded-2xl bg-[#121217] border border-[#F59E0B]/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Film className="w-10 h-10 text-[#E50914]" />
                </div>
                <div className="text-center">
                  <div className="font-black text-base sm:text-lg tracking-tight text-[#F3F4F6]">
                    REEL<span className="text-[#E50914]">PACK</span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] font-medium">
                    Acteurs • Films • Séries • Rôles
                  </div>
                </div>
              </div>

              <div className="w-full pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-[#9CA3AF]">En stock</span>
                <span className="font-black text-[#F59E0B]">
                  {packStock?.storedPacks ?? 0} / {packStock?.maxStock ?? 10}
                </span>
              </div>

              <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#E50914] via-[#F59E0B] to-[#E50914]" />
            </div>

            {(packStock?.storedPacks ?? 0) > 0 && (
              <div className="absolute -top-2.5 -right-2.5 z-20 px-2.5 py-1 rounded-full bg-[#E50914] text-white font-black text-xs shadow-lg border-2 border-[#121217]">
                ×{packStock?.storedPacks} prêt
                {(packStock?.storedPacks ?? 0) > 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="w-full max-w-xs space-y-1.5">
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: packStock?.maxStock ?? 10 }).map(
                (_, idx) => {
                  const isFilled = idx < (packStock?.storedPacks ?? 0);
                  return (
                    <div
                      key={`pack-slot-bar-${idx}`}
                      className={`h-1.5 rounded-full transition-all ${
                        isFilled
                          ? "bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                          : "bg-[#181820] border border-white/5"
                      }`}
                    />
                  );
                },
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            disabled={!canOpen || openPack.isPending}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl border-b-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl ${
              canOpen
                ? "bg-[#E50914] hover:bg-[#f6121d] border-red-950 text-white active:translate-y-0.5 cursor-pointer"
                : "bg-[#181820] border-white/5 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>
              {openPack.isPending
                ? "Ouverture..."
                : canOpen
                  ? "Ouvrir le Pack (5 cartes)"
                  : `Prochain dans ${formatSecondsMMSS(packStock?.secondsToNextPack ?? 0)}`}
            </span>
          </button>

          {error && <p className="text-[#F87171] text-sm">{error}</p>}
        </div>
      </section>

      {/* Raccourcis rapides */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate("/profile")}
          className="rounded-2xl bg-[#121217] hover:bg-[#181820] border border-white/[0.08] p-3.5 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Ma Collection
            </div>
            <div className="text-sm sm:text-base font-black text-[#F3F4F6]">
              {uniqueCardsOwned} cartes uniques ({totalCopiesOwned} au total)
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-white transition-all shrink-0" />
        </div>

        <div
          onClick={() => navigate("/marketplace")}
          className="rounded-2xl bg-[#121217] hover:bg-[#181820] border border-white/[0.08] p-3.5 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
              Marché Joueurs
            </div>
            <div className="text-sm sm:text-base font-black text-[#F3F4F6]">
              {listings.length} offres
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-white transition-all shrink-0" />
        </div>

        <div
          onClick={() => navigate("/shop")}
          className="rounded-2xl bg-[#121217] hover:bg-[#181820] border border-white/[0.08] p-3.5 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
              Boutique du Jour
            </div>
            <div className="text-sm sm:text-base font-black text-[#F3F4F6]">
              {availableShopCards} / {shopCards.length} cartes dispo
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-white transition-all shrink-0" />
        </div>

        <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-3.5 flex items-center justify-between group">
          <div
            onClick={() => navigate("/social")}
            className="cursor-pointer flex-1"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#E50914]">
              Amis & Social
            </div>
            <div className="text-sm sm:text-base font-black text-[#F3F4F6]">
              {friends.length} ami{friends.length > 1 ? "s" : ""}
            </div>
          </div>
          {friends.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/social")}
              className="px-2.5 py-1.5 rounded-xl bg-[#181820] hover:bg-[#22222C] border border-[#F59E0B]/40 text-[11px] font-bold text-[#FBBF24] flex items-center gap-1 shrink-0"
            >
              <Repeat className="w-3 h-3" />
              <span>Échanger</span>
            </button>
          )}
        </div>
      </section>

      {/* Dernières cartes obtenues (cette session) */}
      {drawnResolved && drawnResolved.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#F3F4F6]">
              Dernières cartes obtenues
            </h2>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-xs font-bold text-[#E50914] flex items-center gap-0.5"
            >
              <span>Tout voir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-5">
            {drawnResolved.map((card) => (
              <CinemaCard
                key={card.id}
                name={card.name}
                subtitle={card.subtitle}
                imageUrl={card.imageUrl}
                typeEmoji={card.typeEmoji}
                typeLabel={card.typeLabel}
                rarity={card.rarity}
                quantity={1}
                isNew={true}
                onClick={() => goToDetail(card)}
                compact={true}
              />
            ))}
          </div>
        </section>
      )}

      {showReveal && drawnResolved && drawnResolved.length > 0 && (
        <PackRevealModal
          cards={drawnResolved as RevealCard[]}
          onClose={() => setShowReveal(false)}
          onSelectCard={(card) => {
            setShowReveal(false);
            goToDetail(card);
          }}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { X } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import type { RarityKey } from "../../design/rarity";

export interface RevealCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

interface PackRevealModalProps {
  cards: RevealCard[];
  onClose: () => void;
  onSelectCard: (card: RevealCard) => void;
}

type Stage = "revealed" | "summary";

export function PackRevealModal({
  cards,
  onClose,
  onSelectCard,
}: PackRevealModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("revealed");
  const [animKey, setAnimKey] = useState(0);

  function handleAdvance() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
      return;
    }
    // Sur mobile, le récapitulatif fait doublon avec les cartes qu'on vient
    // de voir une par une : on ferme directement au lieu de l'afficher.
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile) {
      onClose();
      return;
    }
    setStage("summary");
  }

  if (stage === "summary") {
    return (
      <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none overflow-y-auto">
        <div className="w-full max-w-4xl rounded-3xl bg-[#121217] border border-white/15 p-5 sm:p-6 space-y-5 my-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                ReelPack ouvert • {cards.length} Cartes obtenues
              </span>
              <h2 className="text-xl font-black text-[#F3F4F6]">
                Récapitulatif de votre tirage
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#181820] text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {cards.map((c) => (
              <CinemaCard
                key={`sum-${c.id}`}
                name={c.name}
                subtitle={c.subtitle}
                imageUrl={c.imageUrl}
                typeEmoji={c.typeEmoji}
                typeLabel={c.typeLabel}
                rarity={c.rarity}
                quantity={1}
                isNew={true}
                compact={true}
                onClick={() => onSelectCard(c)}
              />
            ))}
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white font-black text-xs uppercase tracking-wider"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isLegendary = currentCard.rarity === "legendary";
  const isEpic = currentCard.rarity === "epic";

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none overflow-y-auto">
      <div
        key={animKey}
        onClick={handleAdvance}
        className="relative w-full max-w-sm flex flex-col items-center justify-center space-y-6 cursor-pointer"
      >
        {isLegendary && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-[#F59E0B]/25 blur-3xl animate-pulse" />
          </div>
        )}

        <div className="flex items-center gap-1.5 z-10">
          {cards.map((_, idx) => (
            <div
              key={`dot-${idx}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-7 bg-[#E50914]"
                  : idx < currentIndex
                    ? "w-3 bg-white/50"
                    : "w-3 bg-white/15"
              }`}
            />
          ))}
        </div>

        <div
          className={`w-full max-w-[290px] rounded-2xl transition-all duration-500 ${
            isLegendary
              ? "ring-2 ring-[#F59E0B] shadow-[0_0_55px_rgba(245,158,11,0.45)] scale-[1.02]"
              : isEpic
                ? "ring-1 ring-[#A78BFA] shadow-[0_0_35px_rgba(167,139,250,0.3)]"
                : ""
          }`}
        >
          <CinemaCard
            name={currentCard.name}
            subtitle={currentCard.subtitle}
            imageUrl={currentCard.imageUrl}
            typeEmoji={currentCard.typeEmoji}
            typeLabel={currentCard.typeLabel}
            rarity={currentCard.rarity}
            quantity={1}
            isNew={true}
          />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAdvance();
          }}
          className={`px-7 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider border-b-4 transition-all shadow-lg ${
            isLegendary
              ? "bg-[#F59E0B] hover:bg-[#fbbf24] text-black border-amber-700"
              : "bg-[#E50914] hover:bg-[#f6121d] text-white border-red-950"
          }`}
        >
          {currentIndex < cards.length - 1
            ? "Carte suivante"
            : typeof window !== "undefined" && window.innerWidth < 640
              ? "Terminer"
              : "Voir le récapitulatif"}
        </button>
      </div>
    </div>
  );
}

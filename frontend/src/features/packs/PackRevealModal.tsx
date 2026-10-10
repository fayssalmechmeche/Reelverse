import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Coins, ExternalLink, Tag, Volume2, VolumeX } from "lucide-react";
import { CinemaCard } from "../../components/CinemaCard";
import type { RarityKey } from "../../design/rarity";
import { useInventory } from "../inventory/useInventory";
import { QuickSellModal } from "../inventory/QuickSellModal";
import { QuickListModal } from "../marketplace/QuickListModal";
import { RARITY_CONFIG } from "../../design/rarity";
import { isMuted, playReveal, setMuted } from "./packSounds";
import { LegendaryFx } from "./LegendaryFx";

// Miroir de QuickSellPricing.php, uniquement pour l'affichage (le serveur fait foi).
const SELL_PRICE: Record<RarityKey, number> = {
  common: 20,
  uncommon: 50,
  rare: 120,
  epic: 300,
  legendary: 800,
};

export interface RevealCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  isNew: boolean;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

interface PackRevealModalProps {
  cards: RevealCard[];
  onClose: () => void;
  /** Optionnel : ouvre la fiche. Proposé seulement au récapitulatif, car il quitte l'ouverture. */
  onSelectCard?: (card: RevealCard) => void;
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
  const [actionCard, setActionCard] = useState<RevealCard | null>(null);
  const [sellTarget, setSellTarget] = useState<RevealCard | null>(null);
  const [listTarget, setListTarget] = useState<RevealCard | null>(null);
  // Cartes vendues ou mises sur le marché pendant cette ouverture.
  const [doneIds, setDoneIds] = useState<Record<number, "sold" | "listed">>({});
  const { data: inventory = [] } = useInventory();
  const [muted, setMutedState] = useState(isMuted());

  // Son à chaque nouvelle carte révélée (le clic qui a ouvert le pack
  // sert de geste utilisateur pour débloquer l'audio).
  useEffect(() => {
    if (stage === "revealed") playReveal(cards[currentIndex].rarity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, stage]);

  function toggleMute() {
    setMuted(!muted);
    setMutedState(!muted);
  }

  // RevealCard.id est l'id de la Card ; la vente attend l'id du UserCard.
  const userCardOf = (card: RevealCard) =>
    inventory.find((u) => u.cardId === card.id);

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

  const overlays = (
    <>
      {actionCard && !sellTarget && !listTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/75 flex items-end sm:items-center justify-center p-4"
          onClick={() => setActionCard(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#121217] border border-white/15 p-4 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <div className="w-24 aspect-[2/3] rounded-lg overflow-hidden bg-[#0B0B0E] shrink-0">
                {actionCard.imageUrl && (
                  <img
                    src={actionCard.imageUrl}
                    alt={actionCard.name}
                    className="w-full h-full object-cover object-top"
                  />
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <span
                  style={RARITY_CONFIG[actionCard.rarity].badgeStyle}
                  className="self-start rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {RARITY_CONFIG[actionCard.rarity].label}
                </span>
                <h3 className="text-lg font-black text-[#F3F4F6] leading-tight">
                  {actionCard.name}
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  {actionCard.typeEmoji} {actionCard.typeLabel}
                  {actionCard.subtitle ? ` • ${actionCard.subtitle}` : ""}
                </p>
                {userCardOf(actionCard) && (
                  <p className="text-[11px] text-[#9CA3AF]">
                    Tu en possèdes ×{userCardOf(actionCard)!.quantity}
                  </p>
                )}
              </div>
            </div>

            {doneIds[actionCard.id] ? (
              <p className="text-xs text-[#9CA3AF]">
                {doneIds[actionCard.id] === "sold"
                  ? "Carte vendue."
                  : "Carte mise en vente sur le marché."}
              </p>
            ) : userCardOf(actionCard) ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSellTarget(actionCard)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-xs font-black uppercase tracking-wider text-[#F59E0B] hover:bg-[#F59E0B]/25"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Vente rapide (+{SELL_PRICE[actionCard.rarity]} coins)
                </button>
                <button
                  type="button"
                  onClick={() => setListTarget(actionCard)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#181820] border border-white/15 text-xs font-black uppercase tracking-wider text-[#F3F4F6] hover:border-white/30"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Mettre sur le marché
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#9CA3AF]">Chargement...</p>
            )}

            {stage === "summary" &&
              onSelectCard &&
              actionCard.type !== "character" && (
                <button
                  type="button"
                  onClick={() => onSelectCard(actionCard)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#9CA3AF] hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Voir la fiche (quitte l'ouverture)
                </button>
              )}

            <button
              type="button"
              onClick={() => setActionCard(null)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#181820] text-xs font-bold text-[#9CA3AF] hover:text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {sellTarget && userCardOf(sellTarget) && (
        <QuickSellModal
          target={{
            id: userCardOf(sellTarget)!.id,
            name: sellTarget.name,
            quantity: userCardOf(sellTarget)!.quantity,
          }}
          onClose={() => setSellTarget(null)}
          onSold={() => {
            setDoneIds((p) => ({ ...p, [sellTarget.id]: "sold" }));
            setSellTarget(null);
          }}
        />
      )}

      {listTarget && userCardOf(listTarget) && (
        <QuickListModal
          target={{
            cardId: listTarget.id,
            name: listTarget.name,
            imageUrl: listTarget.imageUrl,
            rarityLabel: RARITY_CONFIG[listTarget.rarity].label,
            quantity: userCardOf(listTarget)!.quantity,
          }}
          onClose={() => setListTarget(null)}
          onListed={() => {
            setDoneIds((p) => ({ ...p, [listTarget.id]: "listed" }));
            setListTarget(null);
          }}
        />
      )}
    </>
  );

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
                isNew={c.isNew}
                compact={true}
                onClick={() => setActionCard(c)}
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
        {createPortal(overlays, document.body)}
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
        {isLegendary && <LegendaryFx />}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          aria-label={muted ? "Activer le son" : "Couper le son"}
          title={muted ? "Activer le son" : "Couper le son"}
          className="absolute -top-2 right-0 z-20 p-2 rounded-xl bg-[#181820] border border-white/10 text-[#9CA3AF] hover:text-white"
        >
          {muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

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
          className={`relative z-10 w-full max-w-[290px] ${isLegendary ? "rv-shake" : ""}`}
        >
          <div
            className={`w-full rounded-2xl ${
              isLegendary
                ? "rv-pop ring-2 ring-[#F59E0B] shadow-[0_0_55px_rgba(245,158,11,0.45)]"
                : isEpic
                  ? "rv-pop ring-1 ring-[#A78BFA] shadow-[0_0_35px_rgba(167,139,250,0.3)]"
                  : ""
            }`}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActionCard(currentCard);
              }}
            >
              <CinemaCard
                name={currentCard.name}
                subtitle={currentCard.subtitle}
                imageUrl={currentCard.imageUrl}
                typeEmoji={currentCard.typeEmoji}
                typeLabel={currentCard.typeLabel}
                rarity={currentCard.rarity}
                quantity={1}
                isNew={currentCard.isNew}
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#9CA3AF] -mt-3 z-10">
          {doneIds[currentCard.id] === "sold"
            ? "Vendue"
            : doneIds[currentCard.id] === "listed"
              ? "Mise en vente sur le marché"
              : "Touche la carte pour la vendre ou la mettre sur le marché"}
        </p>

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

      {createPortal(overlays, document.body)}
    </div>
  );
}

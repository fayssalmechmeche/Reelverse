import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import {
  useShop,
  useBuyShopCard,
  useRefreshShopCard,
  type ShopCardData,
} from "./useShop";

const TYPE_META: Record<
  ShopCardData["type"],
  { emoji: string; label: string }
> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

export function ShopScreen() {
  const navigate = useNavigate();
  const { data: shopCards = [], isLoading } = useShop();
  const buyCard = useBuyShopCard();
  const refreshCard = useRefreshShopCard();
  const [actionError, setActionError] = useState<string | null>(null);

  const resolvedResults = useResolvedCards(
    shopCards.map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const cards = useMemo(
    () =>
      shopCards.map((c, idx) => {
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
      }),
    [shopCards, resolvedResults],
  );

  function run(promise: Promise<unknown>) {
    setActionError(null);
    promise.catch((err: Error) => setActionError(err.message));
  }

  function goToDetail(card: { type: ShopCardData["type"]; entityId: number }) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
    if (card.type === "character") navigate(`/characters/${card.entityId}`);
  }

  if (isLoading) return <p className="text-[#9CA3AF]">Chargement du shop...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[#F3F4F6]">Boutique du jour</h2>

      {actionError && <p className="text-[#F87171] text-sm">{actionError}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {cards.map((card) => (
          <div key={card.id} className="space-y-1 sm:space-y-2">
            <div className={card.sold ? "opacity-40 pointer-events-none" : ""}>
              <CinemaCard
                name={card.name}
                subtitle={card.subtitle}
                imageUrl={card.imageUrl}
                typeEmoji={card.typeEmoji}
                typeLabel={card.typeLabel}
                rarity={card.rarity}
                quantity={card.sold ? 0 : 1}
                onClick={() => goToDetail(card)}
                compact={true}
              />
            </div>

            {!card.sold && (
              <div className="flex gap-1 sm:gap-1.5">
                <button
                  onClick={() => run(buyCard.mutateAsync(card.id))}
                  disabled={buyCard.isPending}
                  className="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg bg-[#E50914] hover:bg-[#f6121d] text-white text-[9px] sm:text-[11px] font-black uppercase tracking-wide disabled:opacity-50"
                >
                  {card.price} Coins
                </button>
                {!card.refreshed && (
                  <button
                    onClick={() => run(refreshCard.mutateAsync(card.id))}
                    disabled={refreshCard.isPending}
                    className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2A2A36] text-[#9CA3AF] text-[9px] sm:text-[11px] font-bold disabled:opacity-50"
                  >
                    ↻
                  </button>
                )}
              </div>
            )}

            {card.sold && (
              <p className="text-center text-[9px] sm:text-[10px] text-[#71717A] font-semibold uppercase">
                Vendue
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

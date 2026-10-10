import { useMemo } from "react";
import { useMarketplaceListings, useCardPriceHistory } from "./useMarketplace";

function timeAgo(iso: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/**
 * Repères de prix pour la carte choisie : les moins chères en vente
 * maintenant et les dernières ventes. Un clic sur un prix le reprend.
 */
export function PriceHints({
  cardId,
  onPick,
}: {
  cardId: number;
  onPick: (price: number) => void;
}) {
  const { data: listings } = useMarketplaceListings();
  const { data: history, isLoading } = useCardPriceHistory(cardId);

  const offers = useMemo(
    () =>
      (listings ?? [])
        .filter((l) => l.cardId === cardId)
        .map((l) => l.price)
        .sort((a, b) => a - b)
        .slice(0, 3),
    [listings, cardId],
  );
  const sales = (history ?? []).slice(0, 3);

  const chip =
    "px-2 py-1 rounded-lg bg-[#0B0B0E] border border-white/10 hover:border-[#F59E0B]/60 text-[11px] font-black text-[#F59E0B]";

  return (
    <div className="rounded-xl bg-[#181820] border border-white/10 p-3.5 space-y-2.5 text-xs">
      <div className="font-bold text-[#F3F4F6]">Prix sur le marché</div>

      <div className="space-y-1">
        <div className="text-[11px] text-[#9CA3AF]">En vente maintenant</div>
        {offers.length === 0 ? (
          <div className="text-[11px] text-[#9CA3AF]">
            Aucune annonce en ce moment.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {offers.map((price, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(price)}
                className={chip}
              >
                {price}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[11px] text-[#9CA3AF]">Dernières ventes</div>
        {isLoading ? (
          <div className="text-[11px] text-[#9CA3AF]">Chargement...</div>
        ) : sales.length === 0 ? (
          <div className="text-[11px] text-[#9CA3AF]">
            Pas encore de vente pour cette carte.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sales.map((sale, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(sale.price)}
                title={timeAgo(sale.soldAt)}
                className={chip}
              >
                {sale.price}
                <span className="ml-1 font-medium text-[#9CA3AF]">
                  {timeAgo(sale.soldAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

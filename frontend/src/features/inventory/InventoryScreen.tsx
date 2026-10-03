import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { useInventory, useSellCard, type InventoryCard } from "./useInventory";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../wishlist/useWishlist";
import {
  useSaleList,
  useAddToSaleList,
  useRemoveFromSaleList,
} from "../wishlist/useSaleList";

const TYPE_META: Record<
  InventoryCard["type"],
  { emoji: string; label: string }
> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

interface ResolvedUserCard extends InventoryCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

export function InventoryScreen() {
  const navigate = useNavigate();
  const { data: inventory = [], isLoading } = useInventory();
  const sellCard = useSellCard();

  const { data: wishlist = [] } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistedCardIds = useMemo(
    () => new Set(wishlist.map((w) => w.cardId)),
    [wishlist],
  );

  const { data: saleList = [] } = useSaleList();
  const addToSaleList = useAddToSaleList();
  const removeFromSaleList = useRemoveFromSaleList();
  const saleListCardIds = useMemo(
    () => new Set(saleList.map((s) => s.cardId)),
    [saleList],
  );

  const [sellTarget, setSellTarget] = useState<ResolvedUserCard | null>(null);
  const [sellAmount, setSellAmount] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const owned = useMemo(
    () => inventory.filter((c) => c.quantity > 0),
    [inventory],
  );
  const resolvedResults = useResolvedCards(
    owned.map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const cards: ResolvedUserCard[] = useMemo(
    () =>
      owned.map((c, idx) => {
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
    [owned, resolvedResults],
  );

  function goToDetail(card: ResolvedUserCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  function toggleWishlist(cardId: number) {
    if (wishlistedCardIds.has(cardId)) {
      removeFromWishlist.mutate(cardId);
    } else {
      addToWishlist.mutate(cardId);
    }
  }

  function toggleSaleList(cardId: number) {
    if (saleListCardIds.has(cardId)) {
      removeFromSaleList.mutate(cardId);
    } else {
      addToSaleList.mutate(cardId);
    }
  }

  function openSellModal(card: ResolvedUserCard) {
    setSellAmount(1);
    setActionError(null);
    setSellTarget(card);
  }

  function confirmSell() {
    if (!sellTarget) return;
    setActionError(null);
    sellCard.mutate(
      { id: sellTarget.id, quantity: sellAmount },
      {
        onSuccess: () => setSellTarget(null),
        onError: (err: Error) => setActionError(err.message),
      },
    );
  }

  if (isLoading)
    return <p className="text-[#9CA3AF]">Chargement de l'inventaire...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[#F3F4F6]">Ma collection</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.id} className="space-y-2">
            <CinemaCard
              name={card.name}
              subtitle={card.subtitle}
              imageUrl={card.imageUrl}
              typeEmoji={card.typeEmoji}
              typeLabel={card.typeLabel}
              rarity={card.rarity}
              quantity={card.quantity}
              onClick={() => goToDetail(card)}
              compact={true}
              isWishlisted={wishlistedCardIds.has(card.cardId)}
              onToggleWishlist={() => toggleWishlist(card.cardId)}
              isInSaleList={saleListCardIds.has(card.cardId)}
              onToggleSaleList={() => toggleSaleList(card.cardId)}
            />
            <button
              onClick={() => openSellModal(card)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2A2A36] text-[#9CA3AF] text-[11px] font-bold"
            >
              Vente rapide
            </button>
          </div>
        ))}
      </div>

      {sellTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121217] border border-white/15 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#F59E0B]">
                  Vente rapide • 0% Taxe
                </span>
                <h3 className="text-lg font-black text-[#F3F4F6]">
                  Vendre {sellTarget.name}
                </h3>
              </div>
              <button
                onClick={() => setSellTarget(null)}
                className="text-[#9CA3AF] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9CA3AF]">
              Vous possédez{" "}
              <strong className="text-white">×{sellTarget.quantity}</strong>{" "}
              copie(s).
            </p>

            <div className="flex items-center justify-between bg-[#181820] p-3.5 rounded-xl border border-white/10">
              <span className="text-xs font-semibold text-[#9CA3AF]">
                Quantité à vendre
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSellAmount((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-[#22222C] font-bold text-white"
                >
                  -
                </button>
                <span className="font-black text-sm w-6 text-center">
                  {sellAmount}
                </span>
                <button
                  onClick={() =>
                    setSellAmount((q) => Math.min(sellTarget.quantity, q + 1))
                  }
                  className="w-7 h-7 rounded-lg bg-[#22222C] font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>

            {actionError && (
              <p className="text-[#F87171] text-sm">{actionError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSellTarget(null)}
                className="px-4 py-2 rounded-xl bg-[#181820] text-xs font-bold text-[#9CA3AF]"
              >
                Annuler
              </button>
              <button
                onClick={confirmSell}
                disabled={sellCard.isPending}
                className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-black uppercase disabled:opacity-50"
              >
                Vendre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

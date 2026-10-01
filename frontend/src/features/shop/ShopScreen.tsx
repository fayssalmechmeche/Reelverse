import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { resolveCard } from "../cards/resolveCard";
import type { RarityKey } from "../../design/rarity";

interface ShopCardData {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  price: number;
  sold: boolean;
  refreshed: boolean;
}

interface ResolvedShopCard extends ShopCardData {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

async function fetchShop(): Promise<{ cards: ShopCardData[] }> {
  const res = await fetch("/api/shop", { credentials: "include" });
  return res.json();
}

export function ShopScreen() {
  const [cards, setCards] = useState<ResolvedShopCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await fetchShop();
    const resolved = await Promise.all(
      data.cards.map(async (c) => {
        const info = await resolveCard(c);
        return { ...c, ...info };
      }),
    );
    setCards(resolved);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleBuy(shopCardId: number) {
    setActionError(null);
    const res = await fetch(`/api/shop/${shopCardId}/buy`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json();
      setActionError(body.error ?? "Erreur lors de l'achat.");
      return;
    }
    await load();
  }

  async function handleRefresh(shopCardId: number) {
    setActionError(null);
    const res = await fetch(`/api/shop/${shopCardId}/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json();
      setActionError(body.error ?? "Erreur lors du refresh.");
      return;
    }
    await load();
  }

  function goToDetail(card: ResolvedShopCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  if (loading) return <p className="text-[#9CA3AF]">Chargement du shop...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-[#F3F4F6]">Boutique du jour</h2>

      {actionError && <p className="text-[#F87171] text-sm">{actionError}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.id} className="space-y-2">
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
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleBuy(card.id)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#f6121d] text-white text-[11px] font-black uppercase tracking-wide"
                >
                  {card.price} Coins
                </button>
                {!card.refreshed && (
                  <button
                    onClick={() => handleRefresh(card.id)}
                    className="px-2 py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2A2A36] text-[#9CA3AF] text-[11px] font-bold"
                  >
                    ↻
                  </button>
                )}
              </div>
            )}

            {card.sold && (
              <p className="text-center text-[10px] text-[#71717A] font-semibold uppercase">
                Vendue
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

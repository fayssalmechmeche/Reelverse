import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { resolveCard } from "../cards/resolveCard";
import type { RarityKey } from "../../design/rarity";

interface DrawnCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
}

interface ResolvedDrawnCard extends DrawnCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

interface OpenPackResponse {
  cards: DrawnCard[];
  remainingPacks: number;
}

async function openPack(): Promise<OpenPackResponse> {
  const res = await fetch("/api/packs/open", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Erreur inconnue");
  }
  return res.json();
}

export function PackOpener() {
  const [cards, setCards] = useState<ResolvedDrawnCard[] | null>(null);
  const [remainingPacks, setRemainingPacks] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleOpen() {
    setLoading(true);
    setError(null);
    try {
      const data = await openPack();
      const resolved = await Promise.all(
        data.cards.map(async (card) => {
          const info = await resolveCard(card);
          return { ...card, ...info };
        }),
      );
      setCards(resolved);
      setRemainingPacks(data.remainingPacks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function goToDetail(card: ResolvedDrawnCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleOpen}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white font-black text-xs uppercase tracking-wider border-b-4 border-red-950 transition-all shadow-lg disabled:opacity-50"
      >
        {loading ? "Ouverture..." : "Ouvrir un pack"}
      </button>

      {error && <p className="text-[#F87171] text-sm">{error}</p>}

      {remainingPacks !== null && (
        <p className="text-[#9CA3AF] text-xs">
          Packs restants : {remainingPacks}
        </p>
      )}

      {cards && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {cards.map((card) => (
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
      )}
    </div>
  );
}

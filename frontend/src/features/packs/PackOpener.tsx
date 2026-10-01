import { useState } from "react";
import { Link } from "react-router-dom";

interface DrawnCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface OpenPackResponse {
  cards: DrawnCard[];
  remainingPacks: number;
}

async function openPack(): Promise<OpenPackResponse> {
  const res = await fetch("/api/packs/open", { method: "POST" });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Erreur inconnue");
  }
  return res.json();
}

function detailPathFor(card: DrawnCard): string | null {
  switch (card.type) {
    case "movie":
      return `/movies/${card.entityId}`;
    case "series":
      return `/series/${card.entityId}`;
    case "person":
      return `/people/${card.entityId}`;
    default:
      return null; // character : pas encore de page détail dédiée
  }
}

export function PackOpener() {
  const [cards, setCards] = useState<DrawnCard[] | null>(null);
  const [remainingPacks, setRemainingPacks] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    setError(null);
    try {
      const data = await openPack();
      setCards(data.cards);
      setRemainingPacks(data.remainingPacks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleOpen} disabled={loading}>
        {loading ? "Ouverture..." : "Ouvrir un pack"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {remainingPacks !== null && <p>Packs restants : {remainingPacks}</p>}

      {cards && (
        <ul>
          {cards.map((card) => {
            const path = detailPathFor(card);
            return (
              <li key={card.id}>
                {card.type} #{card.entityId} — {card.rarity}
                {path && (
                  <>
                    {" "}
                    — <Link to={path}>voir</Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

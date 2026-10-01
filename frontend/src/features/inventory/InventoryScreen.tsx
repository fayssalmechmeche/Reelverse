import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { resolveCard } from "../cards/resolveCard";
import type { RarityKey } from "../../design/rarity";

interface UserCardData {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

interface ResolvedUserCard extends UserCardData {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

async function fetchInventory(): Promise<UserCardData[]> {
  const res = await fetch("/api/inventory", { credentials: "include" });
  return res.json();
}

export function InventoryScreen() {
  const [cards, setCards] = useState<ResolvedUserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellTarget, setSellTarget] = useState<ResolvedUserCard | null>(null);
  const [sellAmount, setSellAmount] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await fetchInventory();
    const owned = data.filter((c) => c.quantity > 0);
    const resolved = await Promise.all(
      owned.map(async (c) => {
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

  function goToDetail(card: ResolvedUserCard) {
    if (card.type === "movie") navigate(`/movies/${card.entityId}`);
    if (card.type === "series") navigate(`/series/${card.entityId}`);
    if (card.type === "person") navigate(`/people/${card.entityId}`);
  }

  function openSellModal(card: ResolvedUserCard) {
    setSellAmount(1);
    setActionError(null);
    setSellTarget(card);
  }

  async function confirmSell() {
    if (!sellTarget) return;
    setActionError(null);

    const res = await fetch(`/api/inventory/${sellTarget.id}/sell`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: sellAmount }),
    });

    if (!res.ok) {
      const body = await res.json();
      setActionError(body.error ?? "Erreur lors de la vente.");
      return;
    }

    setSellTarget(null);
    await load();
  }

  if (loading)
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
                className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-black uppercase"
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

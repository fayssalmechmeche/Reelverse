import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinemaCard } from "../../components/CinemaCard";
import { useResolvedCards, type CardRef } from "../cards/useResolvedCard";
import { useOpenPack, type DrawnCard } from "./usePacks";

const TYPE_META: Record<DrawnCard["type"], { emoji: string; label: string }> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

export function PackOpener() {
  const navigate = useNavigate();
  const openPack = useOpenPack();
  const [drawnCards, setDrawnCards] = useState<DrawnCard[] | null>(null);
  const [remainingPacks, setRemainingPacks] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedResults = useResolvedCards(
    (drawnCards ?? []).map(
      (c): CardRef => ({
        type: c.type,
        entityId: c.entityId,
        rarity: c.rarity,
      }),
    ),
  );

  const cards = useMemo(() => {
    if (!drawnCards) return null;
    return drawnCards.map((c, idx) => {
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
  }, [drawnCards, resolvedResults]);

  function handleOpen() {
    setError(null);
    openPack.mutate(undefined, {
      onSuccess: (data) => {
        setDrawnCards(data.cards);
        setRemainingPacks(data.remainingPacks);
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
    <div className="space-y-4">
      <button
        onClick={handleOpen}
        disabled={openPack.isPending}
        className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#f6121d] text-white font-black text-xs uppercase tracking-wider border-b-4 border-red-950 transition-all shadow-lg disabled:opacity-50"
      >
        {openPack.isPending ? "Ouverture..." : "Ouvrir un pack"}
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
              isNew={card.isNew}
              onClick={() => goToDetail(card)}
              compact={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

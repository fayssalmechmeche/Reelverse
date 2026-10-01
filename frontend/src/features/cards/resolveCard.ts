interface DrawnCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

interface ResolvedCard {
  name: string;
  subtitle: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const TYPE_META: Record<DrawnCard["type"], { emoji: string; label: string }> = {
  person: { emoji: "👤", label: "Acteur" },
  movie: { emoji: "🎬", label: "Film" },
  series: { emoji: "📺", label: "Série" },
  character: { emoji: "🎭", label: "Personnage" },
};

export async function resolveCard(card: DrawnCard): Promise<ResolvedCard> {
  const meta = TYPE_META[card.type];
  const endpoint =
    card.type === "person"
      ? "people"
      : card.type === "movie"
        ? "movies"
        : "series";

  const res = await fetch(`/api/${endpoint}/${card.entityId}`, {
    credentials: "include",
  });
  const data = await res.json();

  const name = data.name ?? data.title ?? "Inconnu";
  const posterPath = data.posterPath ?? data.profilePath ?? null;

  return {
    name,
    subtitle: meta.label,
    imageUrl: posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : null,
    typeEmoji: meta.emoji,
    typeLabel: meta.label,
  };
}

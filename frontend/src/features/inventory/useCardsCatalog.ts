import { useQuery } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface CatalogCard {
  id: number | null; // UserCard id, null si jamais obtenue
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

// Tout le catalogue de cartes du jeu, possédées ou non (contrairement à
// useInventory qui ne renvoie que les cartes déjà obtenues au moins une
// fois). Permet d'afficher les cartes "Manquantes" dans Ma Collection.
export function useCardsCatalog() {
  return useQuery({
    queryKey: ["cardsCatalog"],
    queryFn: async (): Promise<CatalogCard[]> => {
      const res = await fetch("/api/collection/catalog", {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error("Impossible de charger le catalogue de cartes.");
      return res.json();
    },
    staleTime: 10_000,
  });
}

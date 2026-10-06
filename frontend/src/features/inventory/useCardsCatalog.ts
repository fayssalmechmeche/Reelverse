import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface CatalogCard {
  id: number | null; // UserCard id, null si jamais obtenue
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

export type CatalogTab =
  | "ALL"
  | "OWNED"
  | "MISSING"
  | "DUPLICATES"
  | "WISHLIST"
  | "TRADELIST";

export type CatalogSort = "OWNED_FIRST" | "NAME_ASC" | "RARITY_DESC";

export interface CatalogParams {
  page: number;
  perPage: number;
  tab: CatalogTab;
  type?: CatalogCard["type"];
  rarity?: RarityKey;
  hideMissing: boolean;
  search: string;
  sort: CatalogSort;
}

export interface CatalogPage {
  items: CatalogCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  // Compteurs globaux (indépendants des filtres)
  counts: { all: number; owned: number; duplicates: number };
}

function toQueryString(p: CatalogParams): string {
  const qs = new URLSearchParams({
    page: String(p.page),
    perPage: String(p.perPage),
    tab: p.tab,
    sort: p.sort,
  });
  if (p.type) qs.set("type", p.type);
  if (p.rarity) qs.set("rarity", p.rarity);
  if (p.hideMissing) qs.set("hideMissing", "1");
  if (p.search) qs.set("search", p.search);
  return qs.toString();
}

// Une page du catalogue de cartes du jeu, possédées ou non (contrairement à
// useInventory qui ne renvoie que les cartes déjà obtenues au moins une
// fois). Le filtrage, la recherche, le tri et la pagination sont faits par
// le serveur : seule la page demandée est transférée.
export function useCardsCatalog(params: CatalogParams) {
  return useQuery({
    // Préfixe "cardsCatalog" conservé : les invalidateQueries existants
    // (achat, vente, pack...) rafraîchissent toutes les pages.
    queryKey: ["cardsCatalog", params],
    queryFn: async (): Promise<CatalogPage> => {
      const res = await fetch(
        `/api/collection/catalog?${toQueryString(params)}`,
        {
          credentials: "include",
        },
      );
      if (!res.ok)
        throw new Error("Impossible de charger le catalogue de cartes.");
      return res.json();
    },
    // Garde la page précédente affichée pendant le chargement de la suivante
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}

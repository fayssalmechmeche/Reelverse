import { useQuery } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export type CollectionEntityType = "person" | "movie" | "series";
export type CollectionItemType = "movie" | "series" | "character";

export interface CollectionEntity {
  type: CollectionEntityType;
  id: number;
  name: string;
  imageUrl: string | null;
  rarity: RarityKey | null;
  owned: boolean;
  quantity: number;
}

export interface CollectionItem {
  type: CollectionItemType;
  entityId: number;
  name: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
  rarity: RarityKey;
  owned: boolean;
  quantity: number;
  actorId: number | null;
}

export interface CollectionData {
  entity: CollectionEntity;
  items: CollectionItem[];
  ownedCount: number;
  totalCount: number;
}

async function fetchCollection(url: string): Promise<CollectionData> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Impossible de charger cette collection.");
  return res.json();
}

export function usePersonCollection(id: number) {
  return useQuery({
    queryKey: ["collection", "person", id],
    queryFn: () => fetchCollection(`/api/people/${id}/collection`),
  });
}

export function useMovieCollection(id: number) {
  return useQuery({
    queryKey: ["collection", "movie", id],
    queryFn: () => fetchCollection(`/api/movies/${id}/collection`),
  });
}

export function useSeriesCollection(id: number) {
  return useQuery({
    queryKey: ["collection", "series", id],
    queryFn: () => fetchCollection(`/api/series/${id}/collection`),
  });
}

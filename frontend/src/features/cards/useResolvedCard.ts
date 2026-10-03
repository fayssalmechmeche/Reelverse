import { useQueries, useQuery } from "@tanstack/react-query";
import { resolveCard } from "./resolveCard";
import type { RarityKey } from "../../design/rarity";

export interface CardRef {
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
}

function cardQueryKey(ref: Pick<CardRef, "type" | "entityId">) {
  return ["card", ref.type, ref.entityId] as const;
}

export function useResolvedCard(ref: CardRef | null) {
  return useQuery({
    queryKey: ref ? cardQueryKey(ref) : ["card", "none"],
    queryFn: () => resolveCard(ref!),
    enabled: ref !== null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Résout plusieurs cartes en parallèle. Chaque carte est mise en cache
 * individuellement par (type, entityId) : une carte déjà résolue sur un
 * autre écran n'est jamais re-fetchée.
 */
export function useResolvedCards(refs: CardRef[]) {
  return useQueries({
    queries: refs.map((ref) => ({
      queryKey: cardQueryKey(ref),
      queryFn: () => resolveCard(ref),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });
}

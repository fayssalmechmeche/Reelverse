import { useQuery } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface FriendInventoryCard {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

export function useFriendInventory(friendUserId: number | null) {
  return useQuery({
    queryKey: ["friendInventory", friendUserId],
    queryFn: async (): Promise<FriendInventoryCard[]> => {
      const res = await fetch(`/api/friends/${friendUserId}/inventory`, {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
      return res.json();
    },
    enabled: friendUserId !== null,
    staleTime: 10_000,
  });
}

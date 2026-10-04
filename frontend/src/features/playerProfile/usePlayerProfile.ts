import { useQuery } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface PlayerProfileInfo {
  id: number;
  username: string;
}

export interface PlayerInventoryCard {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

export function usePlayerProfile(playerId: number | null) {
  return useQuery({
    queryKey: ["playerProfile", playerId],
    queryFn: async (): Promise<PlayerProfileInfo> => {
      const res = await fetch(`/api/players/${playerId}/profile`, {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
      return res.json();
    },
    enabled: playerId !== null,
    staleTime: 60_000,
  });
}

export function usePlayerInventory(playerId: number | null) {
  return useQuery({
    queryKey: ["playerInventory", playerId],
    queryFn: async (): Promise<PlayerInventoryCard[]> => {
      const res = await fetch(`/api/players/${playerId}/inventory`, {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
      return res.json();
    },
    enabled: playerId !== null,
    staleTime: 10_000,
  });
}

export function usePlayerWishlist(playerId: number | null) {
  return useQuery({
    queryKey: ["playerWishlist", playerId],
    queryFn: async (): Promise<number[]> => {
      const res = await fetch(`/api/players/${playerId}/wishlist`, {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
      const data = await res.json();
      return data.cardIds ?? [];
    },
    enabled: playerId !== null,
    staleTime: 10_000,
  });
}

export function usePlayerSaleList(playerId: number | null) {
  return useQuery({
    queryKey: ["playerSaleList", playerId],
    queryFn: async (): Promise<number[]> => {
      const res = await fetch(`/api/players/${playerId}/sale-list`, {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
      const data = await res.json();
      return data.cardIds ?? [];
    },
    enabled: playerId !== null,
    staleTime: 10_000,
  });
}

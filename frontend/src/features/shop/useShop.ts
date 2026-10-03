import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface ShopCardData {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  price: number;
  sold: boolean;
  refreshed: boolean;
}

export function useShop() {
  return useQuery({
    queryKey: ["shop"],
    queryFn: async (): Promise<ShopCardData[]> => {
      const res = await fetch("/api/shop", { credentials: "include" });
      const data = await res.json();
      return data.cards;
    },
    staleTime: 10_000,
  });
}

function invalidateShop(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["shop"] });
  qc.invalidateQueries({ queryKey: ["inventory"] });
}

export function useBuyShopCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shopCardId: number) => {
      const res = await fetch(`/api/shop/${shopCardId}/buy`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur lors de l'achat.");
      return res.json();
    },
    onSuccess: () => invalidateShop(qc),
  });
}

export function useRefreshShopCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shopCardId: number) => {
      const res = await fetch(`/api/shop/${shopCardId}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur lors du refresh.");
      return res.json();
    },
    onSuccess: () => invalidateShop(qc),
  });
}

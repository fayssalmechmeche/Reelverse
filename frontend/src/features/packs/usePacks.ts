import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface PackStockData {
  storedPacks: number;
  maxStock: number;
  secondsToNextPack: number;
}

export function usePackStock() {
  return useQuery({
    queryKey: ["packStock"],
    queryFn: async (): Promise<PackStockData> => {
      const res = await fetch("/api/packs/stock", { credentials: "include" });
      return res.json();
    },
    staleTime: 5_000,
    refetchInterval: 30_000,
  });
}

export interface DrawnCard {
  id: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
}

export interface OpenPackResponse {
  cards: DrawnCard[];
  remainingPacks: number;
}

export function useOpenPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<OpenPackResponse> => {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur inconnue");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["packStock"] });
    },
  });
}

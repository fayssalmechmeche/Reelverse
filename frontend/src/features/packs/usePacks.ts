import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

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
    },
  });
}

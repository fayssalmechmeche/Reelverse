import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface InventoryCard {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  quantity: number;
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async (): Promise<InventoryCard[]> => {
      const res = await fetch("/api/inventory", { credentials: "include" });
      return res.json();
    },
    staleTime: 10_000,
  });
}

export function useSellCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await fetch(`/api/inventory/${id}/sell`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur lors de la vente.");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

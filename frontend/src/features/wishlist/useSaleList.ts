import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface SaleListCard {
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  addedAt: string;
}

export function useSaleList() {
  return useQuery({
    queryKey: ["saleList"],
    queryFn: async (): Promise<SaleListCard[]> => {
      const res = await fetch("/api/sale-list", { credentials: "include" });
      return res.json();
    },
    staleTime: 10_000,
  });
}

export function useAddToSaleList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: number) => {
      const res = await fetch(`/api/sale-list/${cardId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error('Erreur lors de l\'ajout à la liste "à échanger".');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saleList"] });
      // Les onglets Wishlist / À échanger de Ma Collection sont filtrés par
      // le serveur : on rafraîchit le catalogue.
      qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
    },
  });
}

export function useRemoveFromSaleList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: number) => {
      const res = await fetch(`/api/sale-list/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error('Erreur lors du retrait de la liste "à échanger".');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saleList"] });
      // Les onglets Wishlist / À échanger de Ma Collection sont filtrés par
      // le serveur : on rafraîchit le catalogue.
      qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
    },
  });
}

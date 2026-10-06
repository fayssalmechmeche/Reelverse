import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface WishlistCard {
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  addedAt: string;
}

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async (): Promise<WishlistCard[]> => {
      const res = await fetch("/api/wishlist", { credentials: "include" });
      return res.json();
    },
    staleTime: 10_000,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: number) => {
      const res = await fetch(`/api/wishlist/${cardId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout à la wishlist.");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      // Les onglets Wishlist / À échanger de Ma Collection sont filtrés par
      // le serveur : on rafraîchit le catalogue.
      qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: number) => {
      const res = await fetch(`/api/wishlist/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur lors du retrait de la wishlist.");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      // Les onglets Wishlist / À échanger de Ma Collection sont filtrés par
      // le serveur : on rafraîchit le catalogue.
      qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
    },
  });
}

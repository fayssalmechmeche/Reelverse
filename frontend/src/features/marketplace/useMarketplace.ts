import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface ListingData {
  id: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
  price: number;
  sellerId: number;
  sellerUsername: string;
}

async function fetchListings(): Promise<ListingData[]> {
  const res = await fetch("/api/marketplace", { credentials: "include" });
  return res.json();
}

export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplace", "listings"],
    queryFn: fetchListings,
    staleTime: 10_000,
  });
}

function invalidateAfterTrade(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["marketplace", "listings"] });
  qc.invalidateQueries({ queryKey: ["inventory"] });
  qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cardId,
      price,
    }: {
      cardId: number;
      price: number;
    }) => {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, price }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          body.error ?? "Erreur lors de la création de l'annonce.",
        );
      }
      return res.json();
    },
    onSuccess: () => invalidateAfterTrade(qc),
  });
}

export function useBuyListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: number) => {
      const res = await fetch(`/api/marketplace/${listingId}/buy`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erreur lors de l'achat.");
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAfterTrade(qc);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useCancelListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: number) => {
      const res = await fetch(`/api/marketplace/${listingId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Erreur lors de l'annulation.");
      }
      return res.json();
    },
    onSuccess: () => invalidateAfterTrade(qc),
  });
}

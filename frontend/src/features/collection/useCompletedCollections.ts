import { useQuery } from "@tanstack/react-query";

export interface CompletedCollection {
  type: "person" | "movie" | "series";
  entityId: number;
  name: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
  completedAt: string;
}

export function useCompletedCollections() {
  return useQuery({
    queryKey: ["collections-completed"],
    queryFn: async (): Promise<CompletedCollection[]> => {
      const res = await fetch("/api/collections/completed", {
        credentials: "include",
      });
      if (!res.ok)
        throw new Error("Impossible de charger les collections complétées.");
      return res.json();
    },
    staleTime: 10_000,
  });
}

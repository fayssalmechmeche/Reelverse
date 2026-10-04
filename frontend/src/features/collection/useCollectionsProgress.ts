import { useQuery } from "@tanstack/react-query";

export interface CollectionProgress {
  type: "person" | "movie" | "series";
  entityId: number;
  name: string;
  imageUrl: string | null;
  typeEmoji: string;
  typeLabel: string;
  unitLabel: string;
  ownedCount: number;
  totalCount: number;
}

export function useCollectionsProgress() {
  return useQuery({
    queryKey: ["collections-progress"],
    queryFn: async (): Promise<CollectionProgress[]> => {
      const res = await fetch("/api/collections/progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Impossible de charger les collections.");
      return res.json();
    },
    staleTime: 10_000,
  });
}

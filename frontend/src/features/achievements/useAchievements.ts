import { useQuery } from "@tanstack/react-query";

export interface AchievementData {
  id: number;
  code: string;
  label: string;
  coinsReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<AchievementData[]> => {
      const res = await fetch("/api/achievements", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Impossible de charger les succès.");
      return res.json();
    },
    staleTime: 30_000,
  });
}

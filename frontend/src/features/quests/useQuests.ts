import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface QuestData {
  id: number;
  code: string;
  label: string;
  description: string;
  period: "daily" | "weekly";
  progress: number;
  target: number;
  coinsReward: number;
  claimed: boolean;
  readyToClaim: boolean;
}

export function useQuests() {
  return useQuery({
    queryKey: ["quests"],
    queryFn: async (): Promise<QuestData[]> => {
      const res = await fetch("/api/quests", { credentials: "include" });
      if (!res.ok) throw new Error("Impossible de charger les quêtes.");
      return res.json();
    },
    staleTime: 10_000,
  });
}

export function useClaimQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questId: number): Promise<{ coinsReward: number }> => {
      const res = await fetch(`/api/quests/${questId}/claim`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur inconnue");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quests"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

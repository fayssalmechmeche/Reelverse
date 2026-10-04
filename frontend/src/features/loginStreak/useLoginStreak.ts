import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface LoginStreakReward {
  day: number;
  coinsReward: number;
}

export interface LoginStreakData {
  currentDay: number;
  claimable: boolean;
  coinsReward: number;
  rewards: LoginStreakReward[];
}

export function useLoginStreak() {
  return useQuery({
    queryKey: ["login-streak"],
    queryFn: async (): Promise<LoginStreakData> => {
      const res = await fetch("/api/login-streak", { credentials: "include" });
      if (!res.ok)
        throw new Error("Impossible de charger la récompense de connexion.");
      return res.json();
    },
    staleTime: 10_000,
  });
}

export function useClaimLoginStreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ day: number; coinsReward: number }> => {
      const res = await fetch("/api/login-streak/claim", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur inconnue");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["login-streak"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

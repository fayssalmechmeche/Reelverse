import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RarityKey } from "../../design/rarity";

export interface TradeItem {
  ownerId: number;
  cardId: number;
  type: "person" | "movie" | "series" | "character";
  entityId: number;
  rarity: RarityKey;
}

export interface TradeData {
  id: number;
  proposerId: number;
  proposerUsername: string;
  proposerAvatarUrl: string | null;
  recipientId: number;
  recipientUsername: string;
  recipientAvatarUrl: string | null;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  items: TradeItem[];
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Erreur réseau.");
  return res.json();
}

export function useTrades() {
  return useQuery({
    queryKey: ["trades"],
    queryFn: async (): Promise<TradeData[]> => {
      const res = await fetch("/api/trades", { credentials: "include" });
      return res.json();
    },
    staleTime: 10_000,
  });
}

function invalidateTrades(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["trades"] });
  qc.invalidateQueries({ queryKey: ["inventory"] });
  qc.invalidateQueries({ queryKey: ["cardsCatalog"] });
}

export function useProposeTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      recipientId: number;
      myCards: number[];
      theirCards: number[];
    }) => post("/api/trades", payload),
    onSuccess: () => invalidateTrades(qc),
  });
}

export function useAcceptTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tradeId: number) => post(`/api/trades/${tradeId}/accept`),
    onSuccess: () => invalidateTrades(qc),
  });
}

export function useCancelTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tradeId: number) => post(`/api/trades/${tradeId}/cancel`),
    onSuccess: () => invalidateTrades(qc),
  });
}

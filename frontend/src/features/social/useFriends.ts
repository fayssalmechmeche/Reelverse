import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface FriendEntry {
  id: number;
  userId: number;
  username: string;
}

export interface FriendsData {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

export interface BlockedEntry {
  id: number;
  userId: number;
  username: string;
}

export interface SearchResult {
  id: number;
  username: string;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Erreur réseau.");
  return res.json();
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

export function useFriendsData() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: () => get<FriendsData>("/api/friends"),
    staleTime: 10_000,
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ["blocked"],
    queryFn: () => get<BlockedEntry[]>("/api/blocks"),
    staleTime: 15_000,
  });
}

// Recherche déclenchée à la demande (submit du formulaire), pas une query automatique
export function useSearchUsers() {
  return useMutation({
    mutationFn: (query: string) =>
      get<SearchResult[]>(`/api/search/users?q=${encodeURIComponent(query)}`),
  });
}

function invalidateFriends(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["friends"] });
  qc.invalidateQueries({ queryKey: ["blocked"] });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => post("/api/friends/request", { userId }),
    onSuccess: () => invalidateFriends(qc),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: number) =>
      post(`/api/friends/${friendshipId}/accept`),
    onSuccess: () => invalidateFriends(qc),
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: number) => {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Erreur réseau.");
    },
    onSuccess: () => invalidateFriends(qc),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => post(`/api/users/${userId}/block`),
    onSuccess: () => invalidateFriends(qc),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => post(`/api/users/${userId}/unblock`),
    onSuccess: () => invalidateFriends(qc),
  });
}

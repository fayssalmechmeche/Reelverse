import { useQuery } from "@tanstack/react-query";

export function useFriendSaleList(userId: number | null) {
  return useQuery({
    queryKey: ["friendSaleList", userId],
    queryFn: async (): Promise<number[]> => {
      const res = await fetch(`/api/friends/${userId}/sale-list`, {
        credentials: "include",
      });
      const data = await res.json();
      return data.cardIds ?? [];
    },
    enabled: userId !== null,
    staleTime: 10_000,
  });
}

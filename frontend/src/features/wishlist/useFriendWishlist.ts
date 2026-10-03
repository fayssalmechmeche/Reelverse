import { useQuery } from "@tanstack/react-query";

export function useFriendWishlist(userId: number | null) {
  return useQuery({
    queryKey: ["friendWishlist", userId],
    queryFn: async (): Promise<number[]> => {
      const res = await fetch(`/api/friends/${userId}/wishlist`, {
        credentials: "include",
      });
      const data = await res.json();
      return data.cardIds ?? [];
    },
    enabled: userId !== null,
    staleTime: 10_000,
  });
}

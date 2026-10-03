import { useQuery } from "@tanstack/react-query";

export interface Me {
  id: number;
  username: string;
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me> => {
      const res = await fetch("/api/me", { credentials: "include" });
      return res.json();
    },
    staleTime: 60_000,
  });
}

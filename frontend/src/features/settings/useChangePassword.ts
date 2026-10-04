import { useMutation } from "@tanstack/react-query";

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: ChangePasswordInput): Promise<void> => {
      const res = await fetch("/api/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur réseau.");
      }
    },
  });
}

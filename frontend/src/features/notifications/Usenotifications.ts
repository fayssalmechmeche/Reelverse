import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AppNotification {
  id: number;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsData {
  unreadCount: number;
  items: AppNotification[];
}

export interface NotificationPrefType {
  type: string;
  label: string;
  enabled: boolean;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<NotificationsData> => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Notifications indisponibles");
      return res.json();
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: number[]) => {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : {}),
      });
      if (!res.ok) throw new Error("Échec");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useNotificationPreferences(enabled: boolean) {
  return useQuery({
    queryKey: ["notificationPreferences"],
    enabled,
    queryFn: async (): Promise<{ types: NotificationPrefType[] }> => {
      const res = await fetch("/api/notifications/preferences", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Préférences indisponibles");
      return res.json();
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (enabledByType: Record<string, boolean>) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enabledByType }),
      });
      if (!res.ok) throw new Error("Échec");
      return res.json() as Promise<{ types: NotificationPrefType[] }>;
    },
    onSuccess: (data) => qc.setQueryData(["notificationPreferences"], data),
  });
}

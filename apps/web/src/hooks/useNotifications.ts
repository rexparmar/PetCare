import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { NotificationList } from "../types/api";

// Polling is what makes reminders appear while the app is open: each request
// also asks the API to create any reminders that have just become due.
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<NotificationList>("/notifications"),
    refetchInterval: 30_000,
  });
}

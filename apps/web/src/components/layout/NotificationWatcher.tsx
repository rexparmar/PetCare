import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNotifications } from "../../hooks/useNotifications";
import { api } from "../../services/api";
import type { NotificationPreferences } from "../../types/api";
import { useToast } from "../ui/Toast";

// Renders nothing. It saves the browser's time zone (reminders are scheduled in
// the owner's local time) and announces reminders that arrive while the app
// is open.
export function NotificationWatcher() {
  const client = useQueryClient();
  const { showToast } = useToast();
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api<NotificationPreferences>("/notifications/preferences"),
  });
  const saveZone = useMutation({
    mutationFn: () =>
      api<NotificationPreferences>("/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify({ timeZone: browserZone }),
      }),
    onSuccess: async (saved) => {
      client.setQueryData(["notification-preferences"], saved);
      await client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const needsZone =
    preferences.isSuccess && preferences.data.timeZone !== browserZone;
  const { mutate: syncZone, isPending, isError } = saveZone;
  useEffect(() => {
    if (needsZone && !isPending && !isError) syncZone();
  }, [needsZone, isPending, isError, syncZone]);

  const notifications = useNotifications();
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!notifications.data) return;
    const unread = notifications.data.items.filter((item) => !item.readAt);
    if (seen.current === null) {
      seen.current = new Set(unread.map((item) => item.id));
      return;
    }
    for (const item of unread) {
      if (seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      showToast(item.title);
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      )
        new Notification(item.title, { body: item.message });
    }
  }, [notifications.data, showToast]);

  return null;
}

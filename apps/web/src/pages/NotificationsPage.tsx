import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  Pill,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { useNotifications } from "../hooks/useNotifications";
import { api } from "../services/api";
import type {
  NotificationItem,
  NotificationPreferences,
  NotificationType,
} from "../types/api";
import { formatDateTime } from "../utils/format";

const typeIcon: Record<NotificationType, LucideIcon> = {
  MEDICATION: Pill,
  APPOINTMENT: CalendarDays,
  CLINIC: Stethoscope,
};

const leadOptions = [
  { value: 1, label: "1 hour before" },
  { value: 2, label: "2 hours before" },
  { value: 6, label: "6 hours before" },
  { value: 24, label: "1 day before" },
  { value: 48, label: "2 days before" },
];

function Settings() {
  const client = useQueryClient();
  const { showToast } = useToast();
  const [permission, setPermission] = useState(
    typeof Notification === "undefined"
      ? "unsupported"
      : Notification.permission,
  );
  const query = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => api<NotificationPreferences>("/notifications/preferences"),
  });
  const save = useMutation({
    mutationFn: (changes: Partial<NotificationPreferences>) =>
      api<NotificationPreferences>("/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),
    onSuccess: async (saved) => {
      client.setQueryData(["notification-preferences"], saved);
      showToast("Reminder settings saved.");
      await client.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save settings.",
        "error",
      ),
  });
  const preferences = query.data;
  if (!preferences) return null;

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-bold">Reminder settings</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            checked={preferences.medicationReminders}
            disabled={save.isPending}
            onChange={(event) =>
              save.mutate({ medicationReminders: event.target.checked })
            }
          />
          Medication reminders
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            checked={preferences.appointmentReminders}
            disabled={save.isPending}
            onChange={(event) =>
              save.mutate({ appointmentReminders: event.target.checked })
            }
          />
          Appointment reminders
        </label>
        <div>
          <label className="field-label" htmlFor="leadHours">
            Remind me about appointments
          </label>
          <select
            id="leadHours"
            className="field-input"
            value={preferences.appointmentLeadHours}
            disabled={save.isPending || !preferences.appointmentReminders}
            onChange={(event) =>
              save.mutate({ appointmentLeadHours: Number(event.target.value) })
            }
          >
            {leadOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="field-label">Time zone</p>
          <p className="text-sm text-slate-600">
            {preferences.timeZone ?? "Detecting…"} (taken from your browser)
          </p>
        </div>
      </div>
      {permission !== "unsupported" && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <BellRing size={18} className="text-pine-600" aria-hidden="true" />
          {permission === "granted" ? (
            <p className="text-sm text-slate-600">
              Desktop alerts are on while PetCare is open in a tab.
            </p>
          ) : permission === "denied" ? (
            <p className="text-sm text-slate-600">
              Desktop alerts are blocked in your browser settings.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Get a pop-up when a reminder arrives.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={async () =>
                  setPermission(await Notification.requestPermission())
                }
              >
                Turn on desktop alerts
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export function NotificationsPage() {
  const client = useQueryClient();
  const { showToast } = useToast();
  const query = useNotifications();
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["notifications"] });
  const onError = (error: unknown) =>
    showToast(
      error instanceof Error
        ? error.message
        : "Unable to update notifications.",
      "error",
    );
  const markRead = useMutation({
    mutationFn: (id: string) =>
      api<NotificationItem>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: refresh,
    onError,
  });
  const markAll = useMutation({
    mutationFn: () =>
      api<{ updated: number }>("/notifications/read-all", { method: "POST" }),
    onSuccess: refresh,
    onError,
  });

  const unread = query.data?.unreadCount ?? 0;
  return (
    <>
      <PageHeader
        eyebrow="Reminders"
        title="Reminders & notifications"
        description="Medication doses, upcoming appointments, and clinic replies appear here."
        action={
          unread > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <Check size={18} /> Mark all as read
            </Button>
          ) : undefined
        }
      />
      <Settings />
      {query.isLoading ? (
        <LoadingState label="Loading notifications…" />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error ? query.error.message : undefined
          }
        />
      ) : query.data?.items.length ? (
        <ul className="space-y-3">
          {query.data.items.map((item) => {
            const Icon = typeIcon[item.type] ?? Bell;
            return (
              <li key={item.id}>
                <Card
                  className={item.readAt ? "" : "border-l-4 border-l-pine-500"}
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`text-base ${item.readAt ? "font-semibold text-slate-700" : "font-bold"}`}
                        >
                          {item.title}
                        </h2>
                        {!item.readAt && (
                          <span className="rounded-full bg-pine-50 px-2 py-0.5 text-xs font-bold text-pine-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDateTime(item.dueAt)}
                        {item.pet && (
                          <>
                            {" · "}
                            <Link
                              to={`/pets/${item.pet.id}`}
                              className="font-semibold text-pine-700 hover:underline"
                            >
                              {item.pet.name}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    {!item.readAt && (
                      <Button
                        variant="secondary"
                        onClick={() => markRead.mutate(item.id)}
                        disabled={markRead.isPending}
                        aria-label={`Mark "${item.title}" as read`}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="No reminders yet"
          description="When a medication dose is due or an appointment is coming up, it will show up here."
        />
      )}
    </>
  );
}

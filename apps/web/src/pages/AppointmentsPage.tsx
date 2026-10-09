import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Edit3,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Appointment } from "../types/api";
import { formatDateTime, titleCase } from "../utils/format";

function AppointmentList({
  items,
  empty,
}: {
  items: Appointment[];
  empty: string;
}) {
  const [cancel, setCancel] = useState<Appointment | null>(null);
  const client = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (id: string) =>
      api<Appointment>(`/appointments/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["appointments"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      setCancel(null);
      showToast("Appointment cancelled.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to cancel the appointment.",
        "error",
      ),
  });
  if (!items.length)
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${item.status === "SCHEDULED" ? "bg-pine-50 text-pine-700" : item.status === "COMPLETED" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
          >
            {item.status === "COMPLETED" ? (
              <CheckCircle2 />
            ) : item.status === "CANCELLED" ? (
              <XCircle />
            ) : (
              <Clock3 />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">
                {item.pet.name} · {item.reason}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {titleCase(item.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatDateTime(item.appointmentDate)} · {item.providerName}
            </p>
            {item.notes && (
              <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {item.status === "SCHEDULED" && (
              <>
                <Link
                  to={`/appointments/${item.id}/edit`}
                  className={buttonClass("secondary")}
                >
                  <Edit3 size={16} /> Edit
                </Link>
                <button
                  onClick={() => setCancel(item)}
                  className={buttonClass("ghost")}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </Card>
      ))}
      <ConfirmDialog
        open={Boolean(cancel)}
        title="Cancel this appointment?"
        description="The appointment will remain in your history with a Cancelled status."
        confirmLabel="Cancel appointment"
        busy={mutation.isPending}
        onClose={() => setCancel(null)}
        onConfirm={() => cancel && mutation.mutate(cancel.id)}
      />
    </div>
  );
}

export function AppointmentsPage() {
  const [now] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api<Appointment[]>("/appointments"),
  });
  if (query.isLoading) return <LoadingState label="Loading appointments…" />;
  if (query.isError)
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : undefined}
      />
    );
  const appointments = query.data ?? [];
  const upcoming = appointments.filter(
    (item) =>
      item.status === "SCHEDULED" &&
      new Date(item.appointmentDate).getTime() >= now,
  );
  const history = appointments
    .filter(
      (item) =>
        item.status !== "SCHEDULED" ||
        new Date(item.appointmentDate).getTime() < now,
    )
    .sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime(),
    );
  return (
    <>
      <PageHeader
        eyebrow="Veterinary care"
        title="Appointments"
        description="Plan upcoming visits and keep a clear history of past care."
        action={
          <Link to="/appointments/new" className={buttonClass("primary")}>
            <CalendarPlus size={18} /> Schedule appointment
          </Link>
        }
      />
      <section>
        <h2 className="mb-3 text-lg font-bold">Upcoming</h2>
        {appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="Schedule your first veterinary visit and it will appear here."
            action={
              <Link to="/appointments/new" className={buttonClass("primary")}>
                Schedule a visit
              </Link>
            }
          />
        ) : (
          <AppointmentList items={upcoming} empty="No upcoming appointments." />
        )}
      </section>
      {appointments.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-3 text-lg font-bold">Past and cancelled</h2>
          <AppointmentList
            items={history}
            empty="No appointment history yet."
          />
        </section>
      )}
    </>
  );
}

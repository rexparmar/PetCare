import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Send,
  Share2,
  Stethoscope,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PetCard } from "../components/pets/PetCard";
import { Button, buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type {
  Appointment,
  Clinic,
  ClinicRequest,
  ClinicRequestStatus,
  Pet,
  PetClinicLink,
  RecordsReceipt,
} from "../types/api";
import { formatDateTime } from "../utils/format";

const statusStyle: Record<ClinicRequestStatus, { label: string; css: string }> =
  {
    CONFIRMED: { label: "Confirmed", css: "bg-pine-50 text-pine-700" },
    PENDING: { label: "Waiting for clinic", css: "bg-amber-50 text-amber-700" },
    DECLINED: { label: "Declined", css: "bg-rose-50 text-rose-700" },
  };

function ClinicDetails({ clinic }: { clinic: Clinic }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
      <li className="flex items-center gap-2">
        <MapPin size={15} aria-hidden="true" /> {clinic.address}
      </li>
      <li className="flex items-center gap-2">
        <Phone size={15} aria-hidden="true" /> {clinic.phone}
      </li>
      <li className="flex items-center gap-2">
        <Mail size={15} aria-hidden="true" /> {clinic.email}
      </li>
      <li className="text-slate-500">Hours: {clinic.hours}</li>
    </ul>
  );
}

function PetClinic({ petId }: { petId: string }) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const [unlinking, setUnlinking] = useState(false);
  const [now] = useState(() => Date.now());

  const petQuery = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => api<Pet>(`/pets/${petId}`),
  });
  const linkQuery = useQuery({
    queryKey: ["clinic-link", petId],
    queryFn: () => api<PetClinicLink | null>(`/pets/${petId}/clinic`),
  });
  const clinicsQuery = useQuery({
    queryKey: ["clinics"],
    queryFn: () => api<Clinic[]>("/clinics"),
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () => api<Appointment[]>("/appointments"),
  });
  const requestsQuery = useQuery({
    queryKey: ["clinic-requests", petId],
    queryFn: () => api<ClinicRequest[]>(`/pets/${petId}/clinic/requests`),
    refetchInterval: (query) =>
      query.state.data?.some((request) => request.status === "PENDING")
        ? 15_000
        : false,
  });

  const onError = (error: unknown) =>
    showToast(
      error instanceof Error ? error.message : "Something went wrong.",
      "error",
    );
  const refreshLink = () =>
    client.invalidateQueries({ queryKey: ["clinic-link", petId] });

  const link = useMutation({
    mutationFn: (clinicId: string) =>
      api<PetClinicLink>(`/pets/${petId}/clinic`, {
        method: "PUT",
        body: JSON.stringify({ clinicId }),
      }),
    onSuccess: async () => {
      await refreshLink();
      showToast("Clinic linked.");
    },
    onError,
  });
  const unlink = useMutation({
    mutationFn: () => api<void>(`/pets/${petId}/clinic`, { method: "DELETE" }),
    onSuccess: async () => {
      await refreshLink();
      setUnlinking(false);
      showToast("Clinic unlinked.");
    },
    onError,
  });
  const share = useMutation({
    mutationFn: () =>
      api<RecordsReceipt>(`/pets/${petId}/clinic/share-records`, {
        method: "POST",
      }),
    onSuccess: async (receipt) => {
      await refreshLink();
      showToast(
        `Shared ${receipt.sharedCount} health record${receipt.sharedCount === 1 ? "" : "s"} (receipt ${receipt.receiptId}).`,
      );
    },
    onError,
  });
  const send = useMutation({
    mutationFn: (appointmentId: string) =>
      api<ClinicRequest>(`/pets/${petId}/clinic/requests`, {
        method: "POST",
        body: JSON.stringify({ appointmentId }),
      }),
    onSuccess: async (request) => {
      await client.invalidateQueries({ queryKey: ["clinic-requests", petId] });
      await client.invalidateQueries({ queryKey: ["notifications"] });
      showToast(`Request ${statusStyle[request.status].label.toLowerCase()}.`);
    },
    onError,
  });

  const queries = [
    petQuery,
    linkQuery,
    clinicsQuery,
    appointmentsQuery,
    requestsQuery,
  ];
  if (queries.some((query) => query.isLoading))
    return <LoadingState label="Loading clinic information…" />;
  const failed = queries.find((query) => query.isError);
  if (failed || !petQuery.data)
    return (
      <ErrorState
        message={
          failed?.error instanceof Error ? failed.error.message : undefined
        }
      />
    );

  const pet = petQuery.data;
  const current = linkQuery.data;
  const requests = new Map(
    (requestsQuery.data ?? []).map((request) => [
      request.appointmentId,
      request,
    ]),
  );
  const upcoming = (appointmentsQuery.data ?? []).filter(
    (appointment) =>
      appointment.petId === petId &&
      appointment.status === "SCHEDULED" &&
      new Date(appointment.appointmentDate).getTime() > now,
  );

  return (
    <>
      <Link
        to={`/pets/${petId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> {pet.name}'s profile
      </Link>
      <PageHeader
        eyebrow="Veterinary clinic"
        title={`${pet.name}'s clinic`}
        description="Link a clinic, send it appointment requests, and share health records."
      />
      <p
        className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        role="note"
      >
        Demo clinic network: these clinics are simulated. They answer through
        the same interface a real clinic system would use.
      </p>

      <Card className="mb-6">
        <h2 className="text-lg font-bold">Linked clinic</h2>
        {current?.clinic ? (
          <>
            <p className="mt-2 flex items-center gap-2 text-base font-semibold">
              <Stethoscope
                size={18}
                className="text-pine-600"
                aria-hidden="true"
              />
              {current.clinic.name}
            </p>
            <ClinicDetails clinic={current.clinic} />
            <p className="mt-3 text-sm text-slate-500">
              {current.lastSharedAt
                ? `Last shared ${current.lastSharedCount} health record${current.lastSharedCount === 1 ? "" : "s"} on ${formatDateTime(current.lastSharedAt)}.`
                : "No health records shared yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => share.mutate()} disabled={share.isPending}>
                <Share2 size={18} />
                {share.isPending ? "Sharing…" : "Share health records"}
              </Button>
              <Button variant="secondary" onClick={() => setUnlinking(true)}>
                <Unlink size={18} /> Unlink
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No clinic is linked yet. Choose one below.
          </p>
        )}
      </Card>

      {current?.clinic && (
        <section className="mb-6" aria-labelledby="requests-heading">
          <h2 id="requests-heading" className="mb-3 text-lg font-bold">
            Appointment requests
          </h2>
          {upcoming.length ? (
            <ul className="space-y-3">
              {upcoming.map((appointment) => {
                const request = requests.get(appointment.id);
                const style = request && statusStyle[request.status];
                return (
                  <li key={appointment.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">{appointment.reason}</p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(appointment.appointmentDate)} with{" "}
                            {appointment.providerName}
                          </p>
                          {request && style && (
                            <p className="mt-2 text-sm text-slate-600">
                              <span
                                className={`mr-2 rounded-full px-2.5 py-1 text-xs font-bold ${style.css}`}
                              >
                                {style.label}
                              </span>
                              {request.message}
                            </p>
                          )}
                        </div>
                        <Button
                          variant={request ? "secondary" : "primary"}
                          onClick={() => send.mutate(appointment.id)}
                          disabled={send.isPending}
                        >
                          <Send size={18} />
                          {request ? "Send again" : "Send to clinic"}
                        </Button>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No upcoming appointments"
              description={`Schedule an appointment for ${pet.name}, then send it to the clinic here.`}
              action={
                <Link
                  to={`/appointments/new?petId=${petId}`}
                  className={buttonClass("primary")}
                >
                  Schedule appointment
                </Link>
              }
            />
          )}
        </section>
      )}

      <section aria-labelledby="directory-heading">
        <h2 id="directory-heading" className="mb-3 text-lg font-bold">
          Find a clinic
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(clinicsQuery.data ?? []).map((clinic) => {
            const linked = current?.clinic?.id === clinic.id;
            return (
              <Card key={clinic.id}>
                <h3 className="font-bold">{clinic.name}</h3>
                <ClinicDetails clinic={clinic} />
                <div className="mt-4">
                  <Button
                    variant={linked ? "secondary" : "primary"}
                    disabled={linked || link.isPending}
                    onClick={() => link.mutate(clinic.id)}
                  >
                    {linked
                      ? "Linked"
                      : current?.clinic
                        ? "Switch to this clinic"
                        : `Link ${pet.name}`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={unlinking}
        title="Unlink this clinic?"
        description="Appointment requests already sent keep their status. You can link a clinic again at any time."
        confirmLabel="Unlink clinic"
        busy={unlink.isPending}
        onClose={() => setUnlinking(false)}
        onConfirm={() => unlink.mutate()}
      />
    </>
  );
}

export function ClinicPage() {
  const { petId } = useParams();
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
    enabled: !petId,
  });
  if (petId) return <PetClinic petId={petId} />;
  return (
    <>
      <PageHeader
        eyebrow="Veterinary clinic"
        title="Clinics"
        description="Choose a pet to link a clinic, send appointment requests, or share health records."
      />
      {pets.isLoading ? (
        <LoadingState />
      ) : pets.isError ? (
        <ErrorState
          message={pets.error instanceof Error ? pets.error.message : undefined}
        />
      ) : pets.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pets.data.map((pet) => (
            <div key={pet.id}>
              <PetCard pet={pet} />
              <Link
                to={`/pets/${pet.id}/clinic`}
                className={`${buttonClass("secondary")} mt-2 w-full`}
              >
                <Stethoscope size={17} /> Open clinic
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Add a pet first"
          description="Clinics are linked to a pet profile."
          action={
            <Link to="/pets/new" className={buttonClass("primary")}>
              Add a pet
            </Link>
          }
        />
      )}
    </>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Appointment, Pet } from "../types/api";

const schema = z.object({
  petId: z.string().uuid("Choose a pet."),
  appointmentDate: z.string().min(1, "Choose a date and time."),
  providerName: z
    .string()
    .trim()
    .min(1, "Clinic or veterinarian is required.")
    .max(150),
  reason: z.string().trim().min(1, "Reason is required.").max(200),
  notes: z.string().trim().max(5000),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
});
type FormData = z.infer<typeof schema>;
function localInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AppointmentFormPage() {
  const { id } = useParams();
  const edit = Boolean(id);
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const [minimumDate] = useState(() =>
    localInput(new Date(Date.now() + 60_000).toISOString()),
  );
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
  });
  const appointment = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => api<Appointment>(`/appointments/${id}`),
    enabled: edit,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      petId: search.get("petId") ?? "",
      appointmentDate: "",
      providerName: "",
      reason: "",
      notes: "",
      status: "SCHEDULED",
    },
  });
  useEffect(() => {
    if (appointment.data)
      reset({
        petId: appointment.data.petId,
        appointmentDate: localInput(appointment.data.appointmentDate),
        providerName: appointment.data.providerName,
        reason: appointment.data.reason,
        notes: appointment.data.notes ?? "",
        status: appointment.data.status,
      });
  }, [appointment.data, reset]);
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api<Appointment>(edit ? `/appointments/${id}` : "/appointments", {
        method: edit ? "PATCH" : "POST",
        body: JSON.stringify({
          ...data,
          appointmentDate: new Date(data.appointmentDate).toISOString(),
          notes: data.notes || null,
          ...(edit ? {} : { status: undefined }),
        }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["appointments"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(edit ? "Appointment updated." : "Appointment scheduled.");
      navigate("/appointments");
    },
    onError: (error) =>
      showToast(
        error instanceof Error
          ? error.message
          : "Unable to save the appointment.",
        "error",
      ),
  });
  if (pets.isLoading || (edit && appointment.isLoading))
    return <LoadingState />;
  if (pets.isError || appointment.isError)
    return (
      <ErrorState
        message={
          (pets.error ?? appointment.error) instanceof Error
            ? (pets.error ?? (appointment.error as Error))?.message
            : undefined
        }
      />
    );
  if (!pets.data?.length)
    return (
      <>
        <PageHeader title="Schedule an appointment" />
        <EmptyState
          title="Add a pet first"
          description="Appointments must be connected to one of your pet profiles."
          action={
            <Link to="/pets/new" className="font-bold text-pine-700">
              Add a pet →
            </Link>
          }
        />
      </>
    );
  return (
    <>
      <Link
        to="/appointments"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> Appointments
      </Link>
      <PageHeader
        eyebrow="Veterinary care"
        title={edit ? "Edit appointment" : "Schedule an appointment"}
        description="Dates and times are shown in your local timezone."
      />
      <Card className="mx-auto max-w-3xl p-6 sm:p-8">
        <form
          className="space-y-5"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="petId">
                Pet *
              </label>
              <select id="petId" className="field-input" {...register("petId")}>
                <option value="">Choose a pet</option>
                {pets.data.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
              {errors.petId && (
                <p className="field-error">{errors.petId.message}</p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="appointmentDate">
                Date and time *
              </label>
              <input
                id="appointmentDate"
                type="datetime-local"
                min={!edit ? minimumDate : undefined}
                className="field-input"
                {...register("appointmentDate")}
              />
              {errors.appointmentDate && (
                <p className="field-error">{errors.appointmentDate.message}</p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="providerName">
                Clinic or veterinarian *
              </label>
              <input
                id="providerName"
                className="field-input"
                placeholder="HappyPaws Veterinary Clinic"
                {...register("providerName")}
              />
              {errors.providerName && (
                <p className="field-error">{errors.providerName.message}</p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="reason">
                Reason *
              </label>
              <input
                id="reason"
                className="field-input"
                placeholder="Annual wellness exam"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="field-error">{errors.reason.message}</p>
              )}
            </div>
            {edit && (
              <div>
                <label className="field-label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="field-input"
                  {...register("status")}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                className="field-input"
                placeholder="Anything the clinic should know…"
                {...register("notes")}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              <CalendarCheck size={18} />{" "}
              {mutation.isPending
                ? "Saving…"
                : edit
                  ? "Save changes"
                  : "Schedule appointment"}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Edit3,
  Pause,
  Pill,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { PetCard } from "../components/pets/PetCard";
import { Button, buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Medication, MedicationFrequency, Pet } from "../types/api";
import {
  formatDate,
  formatTimeOfDay,
  localDateInputValue,
} from "../utils/format";

const frequencyOptions: Array<{
  value: MedicationFrequency;
  label: string;
  times: string[];
}> = [
  { value: "ONCE_DAILY", label: "Once a day", times: ["08:00"] },
  { value: "TWICE_DAILY", label: "Twice a day", times: ["08:00", "20:00"] },
  {
    value: "THREE_TIMES_DAILY",
    label: "Three times a day",
    times: ["08:00", "14:00", "20:00"],
  },
  { value: "AS_NEEDED", label: "As needed", times: [] },
];

const frequencyInfo = (value: MedicationFrequency) =>
  frequencyOptions.find((option) => option.value === value)!;

const schema = z
  .object({
    name: z.string().trim().min(1, "Medication name is required.").max(120),
    dosage: z.string().trim().min(1, "Dosage is required.").max(80),
    frequency: z.enum([
      "ONCE_DAILY",
      "TWICE_DAILY",
      "THREE_TIMES_DAILY",
      "AS_NEEDED",
    ]),
    timesOfDay: z.array(z.string()),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string(),
    instructions: z.string().trim().max(2000),
  })
  .superRefine((data, ctx) => {
    const needed = frequencyInfo(data.frequency).times.length;
    const times = data.timesOfDay.slice(0, needed);
    if (times.length < needed || times.some((time) => !time)) {
      ctx.addIssue({
        code: "custom",
        path: ["timesOfDay"],
        message: "Choose a time for every dose.",
      });
    } else if (new Set(times).size !== times.length) {
      ctx.addIssue({
        code: "custom",
        path: ["timesOfDay"],
        message: "Each dose needs a different time.",
      });
    }
    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before the start date.",
      });
    }
  });
type FormData = z.infer<typeof schema>;

const defaultsFor = (medication?: Medication): FormData => ({
  name: medication?.name ?? "",
  dosage: medication?.dosage ?? "",
  frequency: medication?.frequency ?? "ONCE_DAILY",
  timesOfDay: medication?.timesOfDay ?? ["08:00"],
  startDate: medication?.startDate.slice(0, 10) ?? localDateInputValue(),
  endDate: medication?.endDate?.slice(0, 10) ?? "",
  instructions: medication?.instructions ?? "",
});

function MedicationForm({
  medication,
  close,
  petId,
}: {
  medication?: Medication;
  close: () => void;
  petId: string;
}) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(medication),
  });
  useEffect(() => {
    reset(defaultsFor(medication));
  }, [medication, reset]);

  const frequency = useWatch({ control, name: "frequency" });
  const timeCount = frequencyInfo(frequency).times.length;

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api<Medication>(
        medication
          ? `/pets/${petId}/medications/${medication.id}`
          : `/pets/${petId}/medications`,
        {
          method: medication ? "PATCH" : "POST",
          body: JSON.stringify({
            name: data.name,
            dosage: data.dosage,
            frequency: data.frequency,
            timesOfDay: data.timesOfDay.slice(
              0,
              frequencyInfo(data.frequency).times.length,
            ),
            startDate: data.startDate,
            endDate: data.endDate || null,
            instructions: data.instructions || null,
          }),
        },
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["medications", petId] });
      showToast(medication ? "Medication updated." : "Medication added.");
      close();
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save medication.",
        "error",
      ),
  });

  return (
    <Card className="mb-6 border-pine-200 bg-pine-50/30">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {medication ? "Edit medication" : "Add medication"}
        </h2>
        <button
          type="button"
          onClick={close}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>
      <form
        className="space-y-5"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="name">
              Medication name *
            </label>
            <input
              id="name"
              className="field-input"
              placeholder="e.g. Amoxicillin"
              {...register("name")}
            />
            {errors.name && (
              <p className="field-error">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="dosage">
              Dosage *
            </label>
            <input
              id="dosage"
              className="field-input"
              placeholder="e.g. 1 tablet (250 mg)"
              {...register("dosage")}
            />
            {errors.dosage && (
              <p className="field-error">{errors.dosage.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="frequency">
              How often?
            </label>
            <select
              id="frequency"
              className="field-input"
              {...register("frequency", {
                onChange: (event) =>
                  setValue(
                    "timesOfDay",
                    frequencyInfo(event.target.value as MedicationFrequency)
                      .times,
                  ),
              })}
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {timeCount > 0 && (
            <fieldset className="sm:col-span-2">
              <legend className="field-label">Time of each dose</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: timeCount }, (_, index) => (
                  <div key={index}>
                    <label className="sr-only" htmlFor={`timesOfDay-${index}`}>
                      Dose {index + 1} time
                    </label>
                    <input
                      id={`timesOfDay-${index}`}
                      type="time"
                      className="field-input"
                      {...register(`timesOfDay.${index}` as const)}
                    />
                  </div>
                ))}
              </div>
              {errors.timesOfDay && (
                <p className="field-error">
                  {errors.timesOfDay.message ?? "Check the dose times."}
                </p>
              )}
            </fieldset>
          )}
          <div>
            <label className="field-label" htmlFor="startDate">
              Start date *
            </label>
            <input
              id="startDate"
              type="date"
              className="field-input"
              {...register("startDate")}
            />
            {errors.startDate && (
              <p className="field-error">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="endDate">
              End date (optional)
            </label>
            <input
              id="endDate"
              type="date"
              className="field-input"
              {...register("endDate")}
            />
            {errors.endDate && (
              <p className="field-error">{errors.endDate.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="instructions">
              Instructions
            </label>
            <textarea
              id="instructions"
              rows={3}
              className="field-input"
              placeholder="e.g. Give with food"
              {...register("instructions")}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save medication"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PetMedications({ petId }: { petId: string }) {
  const [form, setForm] = useState<Medication | "new" | null>(null);
  const [deleting, setDeleting] = useState<Medication | null>(null);
  const client = useQueryClient();
  const { showToast } = useToast();
  const petQuery = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => api<Pet>(`/pets/${petId}`),
  });
  const medicationsQuery = useQuery({
    queryKey: ["medications", petId],
    queryFn: () => api<Medication[]>(`/pets/${petId}/medications`),
  });
  const toggle = useMutation({
    mutationFn: (medication: Medication) =>
      api<Medication>(`/pets/${petId}/medications/${medication.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !medication.isActive }),
      }),
    onSuccess: async (medication) => {
      await client.invalidateQueries({ queryKey: ["medications", petId] });
      showToast(
        medication.isActive ? "Medication resumed." : "Medication stopped.",
      );
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to update medication.",
        "error",
      ),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/pets/${petId}/medications/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["medications", petId] });
      setDeleting(null);
      showToast("Medication deleted.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to delete medication.",
        "error",
      ),
  });

  if (petQuery.isLoading || medicationsQuery.isLoading)
    return <LoadingState label="Loading medications…" />;
  if (petQuery.isError || medicationsQuery.isError || !petQuery.data)
    return (
      <ErrorState
        message={
          (petQuery.error ?? medicationsQuery.error) instanceof Error
            ? (petQuery.error ?? (medicationsQuery.error as Error))?.message
            : undefined
        }
      />
    );
  const medications = medicationsQuery.data ?? [];
  return (
    <>
      <Link
        to={`/pets/${petId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> {petQuery.data.name}'s profile
      </Link>
      <PageHeader
        eyebrow="Medications"
        title={`${petQuery.data.name}'s medications`}
        description="Keep track of what each pet takes, how often, and for how long."
        action={
          <Button onClick={() => setForm("new")}>
            <Plus size={18} /> Add medication
          </Button>
        }
      />
      {form && (
        <MedicationForm
          petId={petId}
          medication={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {medications.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {medications.map((medication) => (
            <Card
              key={medication.id}
              className={medication.isActive ? "" : "bg-slate-50 opacity-80"}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${medication.isActive ? "bg-pine-50 text-pine-700" : "bg-slate-200 text-slate-600"}`}
                    >
                      {medication.isActive ? "Active" : "Stopped"}
                    </span>
                    <span className="text-sm text-slate-500">
                      {frequencyInfo(medication.frequency).label}
                    </span>
                  </div>
                  <h3 className="mt-3 flex items-center gap-2 text-lg font-bold">
                    <Pill size={18} className="shrink-0 text-pine-600" />
                    <span className="truncate">{medication.name}</span>
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {medication.dosage}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => toggle.mutate(medication)}
                    disabled={toggle.isPending}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-pine-700 disabled:opacity-50"
                    aria-label={`${medication.isActive ? "Stop" : "Resume"} ${medication.name}`}
                  >
                    {medication.isActive ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => setForm(medication)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-pine-700"
                    aria-label={`Edit ${medication.name}`}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleting(medication)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${medication.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {medication.timesOfDay.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                  <Clock size={15} aria-hidden="true" />
                  {medication.timesOfDay.map(formatTimeOfDay).join(" · ")}
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500">
                {formatDate(medication.startDate)} →{" "}
                {medication.endDate
                  ? formatDate(medication.endDate)
                  : "ongoing"}
              </p>
              {medication.instructions && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {medication.instructions}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No medications yet"
          description={`Add ${petQuery.data.name}'s first medication to track the dose and schedule.`}
          action={
            <Button onClick={() => setForm("new")}>
              <Plus size={18} /> Add a medication
            </Button>
          }
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this medication?"
        description="This permanently removes the medication and its schedule."
        confirmLabel="Delete medication"
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}

export function MedicationsPage() {
  const { petId } = useParams();
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
    enabled: !petId,
  });
  if (petId) return <PetMedications petId={petId} />;
  return (
    <>
      <PageHeader
        eyebrow="Medications"
        title="Medications"
        description="Choose a pet to view or add medications."
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
                to={`/pets/${pet.id}/medications`}
                className={`${buttonClass("secondary")} mt-2 w-full`}
              >
                <Pill size={17} /> Open medications
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Add a pet first"
          description="Medications are connected to a pet profile."
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

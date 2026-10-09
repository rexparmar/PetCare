import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Edit3,
  HeartPulse,
  Plus,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import type { HealthRecord, Pet } from "../types/api";
import { formatDate, localDateInputValue, titleCase } from "../utils/format";

const schema = z.object({
  recordType: z.enum([
    "VACCINATION",
    "MEDICAL_CHECKUP",
    "TREATMENT",
    "SURGERY",
    "OTHER",
  ]),
  title: z.string().trim().min(1, "Title is required.").max(150),
  description: z.string().trim().max(5000),
  recordDate: z.string().min(1, "Record date is required."),
  veterinarianName: z.string().trim().max(150),
});
type FormData = z.infer<typeof schema>;

function RecordForm({
  record,
  close,
  petId,
}: {
  record?: HealthRecord;
  close: () => void;
  petId: string;
}) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      recordType: record?.recordType ?? "MEDICAL_CHECKUP",
      title: record?.title ?? "",
      description: record?.description ?? "",
      recordDate: record?.recordDate.slice(0, 10) ?? localDateInputValue(),
      veterinarianName: record?.veterinarianName ?? "",
    },
  });
  useEffect(() => {
    reset({
      recordType: record?.recordType ?? "MEDICAL_CHECKUP",
      title: record?.title ?? "",
      description: record?.description ?? "",
      recordDate: record?.recordDate.slice(0, 10) ?? localDateInputValue(),
      veterinarianName: record?.veterinarianName ?? "",
    });
  }, [record, reset]);
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api<HealthRecord>(
        record
          ? `/pets/${petId}/health-records/${record.id}`
          : `/pets/${petId}/health-records`,
        {
          method: record ? "PATCH" : "POST",
          body: JSON.stringify({
            ...data,
            description: data.description || null,
            veterinarianName: data.veterinarianName || null,
          }),
        },
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["health-records", petId] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(record ? "Health record updated." : "Health record added.");
      close();
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save the record.",
        "error",
      ),
  });
  return (
    <Card className="mb-6 border-pine-200 bg-pine-50/30">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {record ? "Edit health record" : "Add health record"}
        </h2>
        <button
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
            <label className="field-label" htmlFor="recordType">
              Record type
            </label>
            <select
              id="recordType"
              className="field-input"
              {...register("recordType")}
            >
              <option value="VACCINATION">Vaccination</option>
              <option value="MEDICAL_CHECKUP">Medical checkup</option>
              <option value="TREATMENT">Treatment</option>
              <option value="SURGERY">Surgery</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="recordDate">
              Date *
            </label>
            <input
              id="recordDate"
              type="date"
              className="field-input"
              {...register("recordDate")}
            />
            {errors.recordDate && (
              <p className="field-error">{errors.recordDate.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              className="field-input"
              placeholder="e.g. Annual wellness exam"
              {...register("title")}
            />
            {errors.title && (
              <p className="field-error">{errors.title.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="veterinarianName">
              Veterinarian
            </label>
            <input
              id="veterinarianName"
              className="field-input"
              placeholder="Dr. name or clinic"
              {...register("veterinarianName")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="description">
              Notes
            </label>
            <textarea
              id="description"
              rows={4}
              className="field-input"
              {...register("description")}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save record"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PetHealthRecords({ petId }: { petId: string }) {
  const [form, setForm] = useState<HealthRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<HealthRecord | null>(null);
  const client = useQueryClient();
  const { showToast } = useToast();
  const petQuery = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => api<Pet>(`/pets/${petId}`),
  });
  const recordsQuery = useQuery({
    queryKey: ["health-records", petId],
    queryFn: () => api<HealthRecord[]>(`/pets/${petId}/health-records`),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/pets/${petId}/health-records/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["health-records", petId] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleting(null);
      showToast("Health record deleted.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to delete the record.",
        "error",
      ),
  });
  if (petQuery.isLoading || recordsQuery.isLoading)
    return <LoadingState label="Loading health history…" />;
  if (petQuery.isError || recordsQuery.isError || !petQuery.data)
    return (
      <ErrorState
        message={
          (petQuery.error ?? recordsQuery.error) instanceof Error
            ? (petQuery.error ?? (recordsQuery.error as Error))?.message
            : undefined
        }
      />
    );
  const records = recordsQuery.data ?? [];
  return (
    <>
      <Link
        to={`/pets/${petId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> {petQuery.data.name}'s profile
      </Link>
      <PageHeader
        eyebrow="Health history"
        title={`${petQuery.data.name}'s health records`}
        description="A chronological record of vaccinations, checkups, treatments, and other care."
        action={
          <Button onClick={() => setForm("new")}>
            <Plus size={18} /> Add record
          </Button>
        }
      />
      {form && (
        <RecordForm
          petId={petId}
          record={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {records.length ? (
        <div className="relative space-y-4 before:absolute before:bottom-8 before:left-5 before:top-8 before:w-px before:bg-pine-200">
          {records.map((record) => (
            <Card key={record.id} className="relative ml-12">
              <span className="absolute -left-[2.55rem] top-6 grid h-9 w-9 place-items-center rounded-full border-4 border-cream bg-pine-600 text-white">
                <HeartPulse size={15} />
              </span>
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-pine-50 px-2.5 py-1 text-xs font-bold text-pine-700">
                      {titleCase(record.recordType)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {formatDate(record.recordDate)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{record.title}</h3>
                  {record.veterinarianName && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Stethoscope size={15} /> {record.veterinarianName}
                    </p>
                  )}
                  {record.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {record.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setForm(record)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-pine-700"
                    aria-label={`Edit ${record.title}`}
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleting(record)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${record.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No health records yet"
          description={`Add ${petQuery.data.name}'s first vaccination, checkup, treatment, or other care record.`}
          action={
            <Button onClick={() => setForm("new")}>
              <Plus size={18} /> Add a record
            </Button>
          }
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this health record?"
        description="This permanently removes the record from the pet's health history."
        confirmLabel="Delete record"
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}

export function HealthRecordsPage() {
  const { petId } = useParams();
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
    enabled: !petId,
  });
  if (petId) return <PetHealthRecords petId={petId} />;
  return (
    <>
      <PageHeader
        eyebrow="Health history"
        title="Health records"
        description="Choose a pet to view or add health information."
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
                to={`/pets/${pet.id}/health-records`}
                className={`${buttonClass("secondary")} mt-2 w-full`}
              >
                <HeartPulse size={17} /> Open health records
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Add a pet first"
          description="Health records are connected to a pet profile."
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

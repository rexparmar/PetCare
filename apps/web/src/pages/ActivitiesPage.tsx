import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  ArrowLeft,
  Bone,
  Clock,
  Edit3,
  Footprints,
  GraduationCap,
  MapPin,
  Plus,
  Scissors,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import type { ActivityType, Pet, PetActivity } from "../types/api";
import {
  formatDateTime,
  formatDuration,
  localDateInputValue,
  localDateTimeInputValue,
} from "../utils/format";

const activityMeta: Record<ActivityType, { label: string; icon: LucideIcon }> =
  {
    WALK: { label: "Walk", icon: Footprints },
    PLAY: { label: "Play", icon: Bone },
    FEEDING: { label: "Feeding", icon: Utensils },
    GROOMING: { label: "Grooming", icon: Scissors },
    TRAINING: { label: "Training", icon: GraduationCap },
    OTHER: { label: "Other", icon: ActivityIcon },
  };
const activityTypes = Object.keys(activityMeta) as ActivityType[];

const optionalNumber = (label: string, max: number, integer = false) =>
  z.union([
    z.literal(""),
    integer
      ? z.coerce
          .number()
          .int("Use whole minutes.")
          .min(1, `${label} must be at least 1.`)
          .max(max, `${label} must be at most ${max}.`)
      : z.coerce
          .number()
          .positive(`${label} must be positive.`)
          .max(max, `${label} must be at most ${max}.`),
  ]);

const schema = z.object({
  activityType: z.enum([
    "WALK",
    "PLAY",
    "FEEDING",
    "GROOMING",
    "TRAINING",
    "OTHER",
  ]),
  activityDate: z
    .string()
    .min(1, "Date and time are required.")
    .refine((value) => new Date(value).getTime() <= Date.now() + 60_000, {
      message: "Activities cannot be in the future.",
    }),
  durationMinutes: optionalNumber("Duration", 1440, true),
  distanceKm: optionalNumber("Distance", 500),
  notes: z.string().trim().max(2000),
});
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const defaultsFor = (activity?: PetActivity): FormInput => ({
  activityType: activity?.activityType ?? "WALK",
  activityDate: localDateTimeInputValue(
    activity ? new Date(activity.activityDate) : new Date(),
  ),
  durationMinutes: activity?.durationMinutes ?? "",
  distanceKm: activity?.distanceKm ?? "",
  notes: activity?.notes ?? "",
});

function ActivityForm({
  activity,
  close,
  petId,
}: {
  activity?: PetActivity;
  close: () => void;
  petId: string;
}) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(activity),
  });
  useEffect(() => {
    reset(defaultsFor(activity));
  }, [activity, reset]);
  const type = useWatch({ control, name: "activityType" });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api<PetActivity>(
        activity
          ? `/pets/${petId}/activities/${activity.id}`
          : `/pets/${petId}/activities`,
        {
          method: activity ? "PATCH" : "POST",
          body: JSON.stringify({
            activityType: data.activityType,
            activityDate: new Date(data.activityDate).toISOString(),
            durationMinutes:
              data.durationMinutes === "" ? null : data.durationMinutes,
            distanceKm:
              data.activityType === "WALK" && data.distanceKm !== ""
                ? data.distanceKm
                : null,
            notes: data.notes || null,
          }),
        },
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["activities", petId] });
      showToast(activity ? "Activity updated." : "Activity logged.");
      close();
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save the activity.",
        "error",
      ),
  });

  return (
    <Card className="mb-6 border-pine-200 bg-pine-50/30">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {activity ? "Edit activity" : "Log an activity"}
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
        noValidate
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="activityType">
              Activity
            </label>
            <select
              id="activityType"
              className="field-input"
              {...register("activityType")}
            >
              {activityTypes.map((value) => (
                <option key={value} value={value}>
                  {activityMeta[value].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="activityDate">
              When *
            </label>
            <input
              id="activityDate"
              type="datetime-local"
              max={localDateTimeInputValue()}
              className="field-input"
              {...register("activityDate")}
            />
            {errors.activityDate && (
              <p className="field-error">{errors.activityDate.message}</p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="durationMinutes">
              Duration (minutes)
            </label>
            <input
              id="durationMinutes"
              type="number"
              min="1"
              max="1440"
              step="1"
              className="field-input"
              {...register("durationMinutes")}
            />
            {errors.durationMinutes && (
              <p className="field-error">{errors.durationMinutes.message}</p>
            )}
          </div>
          {type === "WALK" && (
            <div>
              <label className="field-label" htmlFor="distanceKm">
                Distance (km)
              </label>
              <input
                id="distanceKm"
                type="number"
                min="0.1"
                max="500"
                step="0.1"
                className="field-input"
                {...register("distanceKm")}
              />
              {errors.distanceKm && (
                <p className="field-error">{errors.distanceKm.message}</p>
              )}
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="field-input"
              placeholder="e.g. Ran at the dog park"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="field-error">{errors.notes.message}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save activity"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function WeekSummary({ activities }: { activities: PetActivity[] }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: localDateInputValue(date),
      label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
        date,
      ),
      count: 0,
    };
  });
  const byKey = new Map(days.map((day) => [day.key, day]));
  let minutes = 0;
  let distance = 0;
  let total = 0;
  for (const activity of activities) {
    const day = byKey.get(localDateInputValue(new Date(activity.activityDate)));
    if (!day) continue;
    day.count += 1;
    total += 1;
    minutes += activity.durationMinutes ?? 0;
    distance += activity.distanceKm ?? 0;
  }
  const max = Math.max(1, ...days.map((day) => day.count));
  const stats = [
    { label: "Activities", value: String(total) },
    { label: "Active time", value: minutes ? formatDuration(minutes) : "—" },
    { label: "Distance", value: distance ? `${distance.toFixed(1)} km` : "—" },
  ];
  return (
    <section
      aria-label="Last 7 days"
      className="mb-6 grid gap-4 lg:grid-cols-3"
    >
      <Card className="lg:col-span-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Last 7 days
        </h2>
        <dl className="mt-4 space-y-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline justify-between"
            >
              <dt className="text-sm text-slate-500">{stat.label}</dt>
              <dd className="text-xl font-extrabold text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Activities per day
        </h2>
        <ul className="mt-4 flex h-32 items-end gap-3">
          {days.map((day) => (
            <li
              key={day.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              aria-label={`${day.label}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
            >
              <span className="text-xs font-bold text-slate-500">
                {day.count || ""}
              </span>
              <span
                className={`w-full rounded-t-lg ${day.count ? "bg-pine-500" : "bg-slate-100"}`}
                style={{
                  height: day.count ? `${(day.count / max) * 70}%` : "4px",
                }}
              />
              <span className="text-xs text-slate-500">{day.label}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function PetActivities({ petId }: { petId: string }) {
  const [form, setForm] = useState<PetActivity | "new" | null>(null);
  const [deleting, setDeleting] = useState<PetActivity | null>(null);
  const client = useQueryClient();
  const { showToast } = useToast();
  const petQuery = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => api<Pet>(`/pets/${petId}`),
  });
  const activitiesQuery = useQuery({
    queryKey: ["activities", petId],
    queryFn: () => api<PetActivity[]>(`/pets/${petId}/activities`),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/pets/${petId}/activities/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["activities", petId] });
      setDeleting(null);
      showToast("Activity deleted.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to delete activity.",
        "error",
      ),
  });

  if (petQuery.isLoading || activitiesQuery.isLoading)
    return <LoadingState label="Loading activity…" />;
  if (petQuery.isError || activitiesQuery.isError || !petQuery.data)
    return (
      <ErrorState
        message={
          (petQuery.error ?? activitiesQuery.error) instanceof Error
            ? (petQuery.error ?? (activitiesQuery.error as Error))?.message
            : undefined
        }
      />
    );
  const activities = activitiesQuery.data ?? [];
  return (
    <>
      <Link
        to={`/pets/${petId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> {petQuery.data.name}'s profile
      </Link>
      <PageHeader
        eyebrow="Activity tracker"
        title={`${petQuery.data.name}'s activity`}
        description="Log walks, play, feeding, grooming, and training to see how active your pet is."
        action={
          <Button onClick={() => setForm("new")}>
            <Plus size={18} /> Log activity
          </Button>
        }
      />
      {form && (
        <ActivityForm
          petId={petId}
          activity={form === "new" ? undefined : form}
          close={() => setForm(null)}
        />
      )}
      {activities.length > 0 && <WeekSummary activities={activities} />}
      {activities.length ? (
        <div className="space-y-3">
          {activities.map((activity) => {
            const { label, icon: Icon } = activityMeta[activity.activityType];
            return (
              <Card key={activity.id}>
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold">{label}</h3>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(activity.activityDate)}
                    </p>
                    {(activity.durationMinutes || activity.distanceKm) && (
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-700">
                        {activity.durationMinutes ? (
                          <span className="flex items-center gap-1.5">
                            <Clock size={15} aria-hidden="true" />
                            {formatDuration(activity.durationMinutes)}
                          </span>
                        ) : null}
                        {activity.distanceKm ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={15} aria-hidden="true" />
                            {activity.distanceKm} km
                          </span>
                        ) : null}
                      </p>
                    )}
                    {activity.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setForm(activity)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-pine-700"
                      aria-label={`Edit ${label} on ${formatDateTime(activity.activityDate)}`}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleting(activity)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${label} on ${formatDateTime(activity.activityDate)}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No activity logged yet"
          description={`Log ${petQuery.data.name}'s first walk, play session, or other routine care.`}
          action={
            <Button onClick={() => setForm("new")}>
              <Plus size={18} /> Log an activity
            </Button>
          }
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this activity?"
        description="This permanently removes the entry from the activity history."
        confirmLabel="Delete activity"
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}

export function ActivitiesPage() {
  const { petId } = useParams();
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
    enabled: !petId,
  });
  if (petId) return <PetActivities petId={petId} />;
  return (
    <>
      <PageHeader
        eyebrow="Activity tracker"
        title="Activity"
        description="Choose a pet to view or log activity."
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
                to={`/pets/${pet.id}/activities`}
                className={`${buttonClass("secondary")} mt-2 w-full`}
              >
                <ActivityIcon size={17} /> Open activity
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Add a pet first"
          description="Activity is tracked per pet profile."
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

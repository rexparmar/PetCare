import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  Edit3,
  HeartPulse,
  Scale,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Pet } from "../types/api";
import { formatDate, petEmoji, titleCase } from "../utils/format";

export function PetDetailPage() {
  const { id } = useParams();
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ["pet", id],
    queryFn: () => api<Pet>(`/pets/${id}`),
  });
  const remove = useMutation({
    mutationFn: () => api<void>(`/pets/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["pets"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      showToast("Pet profile deleted.");
      navigate("/pets");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to delete this pet.",
        "error",
      ),
  });
  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : undefined}
      />
    );
  const pet = query.data;
  return (
    <>
      <Link
        to="/pets"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> All pets
      </Link>
      <section className="rounded-3xl bg-pine-800 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-24 w-24 place-items-center rounded-3xl bg-white/10 text-5xl ring-1 ring-white/10">
            {petEmoji(pet.species)}
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-pine-200">
              {pet.species}
            </p>
            <h1 className="mt-1 text-4xl font-extrabold text-white">
              {pet.name}
            </h1>
            <p className="mt-2 text-pine-100">
              {pet.breed || "Breed not specified"} · {titleCase(pet.gender)}
            </p>
          </div>
          <Link
            to={`/pets/${pet.id}/edit`}
            className={buttonClass("secondary")}
          >
            <Edit3 size={17} /> Edit profile
          </Link>
        </div>
      </section>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.75fr]">
        <Card>
          <h2 className="text-lg font-bold">Profile details</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Born
              </dt>
              <dd className="mt-1 font-semibold text-slate-800">
                {formatDate(pet.dateOfBirth)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Weight
              </dt>
              <dd className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                <Scale size={17} className="text-pine-600" />{" "}
                {pet.weight ? `${pet.weight} kg` : "Not provided"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Medical notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {pet.medicalNotes || "No medical notes have been added."}
              </dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Care actions</h2>
          <div className="mt-4 space-y-3">
            <Link
              to={`/pets/${pet.id}/health-records`}
              className={`${buttonClass("secondary")} w-full justify-start`}
            >
              <HeartPulse size={18} className="text-pine-600" /> Manage health
              records
            </Link>
            <Link
              to={`/appointments/new?petId=${pet.id}`}
              className={`${buttonClass("secondary")} w-full justify-start`}
            >
              <CalendarPlus size={18} className="text-pine-600" /> Schedule
              appointment
            </Link>
            <button
              onClick={() => setConfirm(true)}
              className={`${buttonClass("ghost")} w-full justify-start text-rose-600 hover:bg-rose-50`}
            >
              <Trash2 size={18} /> Delete pet profile
            </button>
          </div>
        </Card>
      </div>
      <ConfirmDialog
        open={confirm}
        title={`Delete ${pet.name}'s profile?`}
        description="This permanently removes the pet profile and its health records and appointments. This action cannot be undone."
        confirmLabel="Delete profile"
        busy={remove.isPending}
        onClose={() => setConfirm(false)}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}

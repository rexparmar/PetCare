import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PetForm, type PetFormData } from "../components/pets/PetForm";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Pet } from "../types/api";

function payload(data: PetFormData) {
  return {
    ...data,
    breed: data.breed || null,
    dateOfBirth: data.dateOfBirth || null,
    weight: data.weight === "" ? null : data.weight,
    medicalNotes: data.medicalNotes || null,
  };
}

export function PetFormPage() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const client = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ["pet", id],
    queryFn: () => api<Pet>(`/pets/${id}`),
    enabled: edit,
  });
  const mutation = useMutation({
    mutationFn: (data: PetFormData) =>
      api<Pet>(edit ? `/pets/${id}` : "/pets", {
        method: edit ? "PATCH" : "POST",
        body: JSON.stringify(payload(data)),
      }),
    onSuccess: async (pet) => {
      await client.invalidateQueries({ queryKey: ["pets"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
      showToast(edit ? "Pet profile updated." : "Pet profile created.");
      navigate(`/pets/${pet.id}`);
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save the pet.",
        "error",
      ),
  });
  if (edit && query.isLoading) return <LoadingState />;
  if (edit && (query.isError || !query.data))
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : undefined}
      />
    );
  return (
    <>
      <Link
        to={edit ? `/pets/${id}` : "/pets"}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> Back
      </Link>
      <PageHeader
        eyebrow="Pet profiles"
        title={edit ? `Edit ${query.data?.name}` : "Add a pet"}
        description="Record the essentials now—you can update them whenever care needs change."
      />
      <Card className="mx-auto max-w-3xl p-6 sm:p-8">
        <PetForm
          key={query.data?.updatedAt}
          pet={query.data}
          onSubmit={async (data) => {
            await mutation.mutateAsync(data);
          }}
          busy={mutation.isPending}
        />
      </Card>
    </>
  );
}

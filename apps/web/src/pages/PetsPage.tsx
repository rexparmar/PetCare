import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PetCard } from "../components/pets/PetCard";
import { buttonClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { api } from "../services/api";
import type { Pet } from "../types/api";

export function PetsPage() {
  const query = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
  });
  return (
    <>
      <PageHeader
        eyebrow="Pet profiles"
        title="My pets"
        description="Keep the details that help you care for each pet in one place."
        action={
          <Link to="/pets/new" className={buttonClass("primary")}>
            <Plus size={18} /> Add pet
          </Link>
        }
      />
      {query.isLoading ? (
        <LoadingState label="Finding your pets…" />
      ) : query.isError ? (
        <ErrorState
          message={
            query.error instanceof Error ? query.error.message : undefined
          }
        />
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pet profiles yet"
          description="Add your first pet to begin tracking care details, health records, and appointments."
          action={
            <Link to="/pets/new" className={buttonClass("primary")}>
              <Plus size={18} /> Add your first pet
            </Link>
          }
        />
      )}
    </>
  );
}

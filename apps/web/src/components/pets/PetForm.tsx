import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Pet } from "../../types/api";
import { localDateInputValue } from "../../utils/format";
import { Button } from "../ui/Button";

const schema = z.object({
  name: z.string().trim().min(1, "Pet name is required.").max(100),
  species: z.string().trim().min(1, "Species is required.").max(80),
  breed: z.string().trim().max(120),
  dateOfBirth: z.string(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  weight: z.union([
    z.literal(""),
    z.coerce.number().positive("Weight must be positive.").max(500),
  ]),
  medicalNotes: z.string().trim().max(5000),
});
type PetFormInput = z.input<typeof schema>;
export type PetFormData = z.output<typeof schema>;

export function PetForm({
  pet,
  onSubmit,
  busy,
}: {
  pet?: Pet;
  onSubmit: (data: PetFormData) => Promise<void>;
  busy?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PetFormInput, unknown, PetFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: pet?.name ?? "",
      species: pet?.species ?? "",
      breed: pet?.breed ?? "",
      dateOfBirth: pet?.dateOfBirth?.slice(0, 10) ?? "",
      gender: pet?.gender ?? "UNKNOWN",
      weight: pet?.weight ?? "",
      medicalNotes: pet?.medicalNotes ?? "",
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Pet name *
          </label>
          <input id="name" className="field-input" {...register("name")} />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="species">
            Species *
          </label>
          <input
            id="species"
            className="field-input"
            placeholder="Dog, cat, rabbit…"
            {...register("species")}
          />
          {errors.species && (
            <p className="field-error">{errors.species.message}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="breed">
            Breed
          </label>
          <input id="breed" className="field-input" {...register("breed")} />
          {errors.breed && (
            <p className="field-error">{errors.breed.message}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="dateOfBirth">
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            max={localDateInputValue()}
            className="field-input"
            {...register("dateOfBirth")}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="gender">
            Gender
          </label>
          <select id="gender" className="field-input" {...register("gender")}>
            <option value="UNKNOWN">Unknown / not specified</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="weight">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            min="0.1"
            max="500"
            step="0.1"
            className="field-input"
            {...register("weight")}
          />
          {errors.weight && (
            <p className="field-error">{errors.weight.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="medicalNotes">
          Medical notes
        </label>
        <textarea
          id="medicalNotes"
          rows={5}
          className="field-input resize-y"
          placeholder="Allergies, conditions, care instructions…"
          {...register("medicalNotes")}
        />
        {errors.medicalNotes && (
          <p className="field-error">{errors.medicalNotes.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          <Save size={18} />{" "}
          {busy ? "Saving…" : pet ? "Save changes" : "Create pet profile"}
        </Button>
      </div>
    </form>
  );
}

import { CalendarDays, ChevronRight, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";
import type { Pet } from "../../types/api";
import { petEmoji, titleCase } from "../../utils/format";
import { Card } from "../ui/Card";

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Link to={`/pets/${pet.id}`} className="group block rounded-2xl">
      <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-pine-200 group-hover:shadow-lg">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pine-50 text-3xl">
            {petEmoji(pet.species)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="truncate text-lg font-bold">{pet.name}</h3>
              <ChevronRight
                size={19}
                className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-pine-600"
              />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {pet.breed || pet.species} · {titleCase(pet.gender)}
            </p>
          </div>
        </div>
        {pet._count && (
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <HeartPulse size={15} className="text-pine-600" />
              {pet._count.healthRecords} records
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} className="text-pine-600" />
              {pet._count.appointments} visits
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}

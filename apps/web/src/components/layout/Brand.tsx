import { PawPrint } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine-600 text-white shadow-sm">
        <PawPrint size={20} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">
          PetCare
        </span>
      )}
    </Link>
  );
}

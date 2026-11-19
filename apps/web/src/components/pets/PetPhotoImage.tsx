import { useQuery } from "@tanstack/react-query";
import { apiBlob } from "../../services/api";
import { blobToDataUrl } from "../../utils/image";

// Photos are private, so they are fetched with the session cookie and shown
// from an in-memory data address instead of a public image URL.
export function PetPhotoImage({
  petId,
  photoId,
  alt,
  className = "",
}: {
  petId: string;
  photoId: string;
  alt: string;
  className?: string;
}) {
  const query = useQuery({
    queryKey: ["photo-file", photoId],
    queryFn: async () =>
      blobToDataUrl(await apiBlob(`/pets/${petId}/photos/${photoId}/file`)),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (query.isError)
    return (
      <div
        role="img"
        aria-label={`${alt} (unavailable)`}
        className={`grid place-items-center bg-slate-100 text-xs text-slate-500 ${className}`}
      >
        Unavailable
      </div>
    );
  if (!query.data)
    return (
      <div
        aria-hidden="true"
        className={`animate-pulse bg-slate-100 ${className}`}
      />
    );
  return <img src={query.data} alt={alt} className={className} />;
}

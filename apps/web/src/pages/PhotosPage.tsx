import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Images, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { PetCard } from "../components/pets/PetCard";
import { PetPhotoImage } from "../components/pets/PetPhotoImage";
import { Button, buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useToast } from "../components/ui/Toast";
import { api } from "../services/api";
import type { Pet, PetPhoto } from "../types/api";
import { formatDate } from "../utils/format";
import { prepareImage } from "../utils/image";

const MAX_PHOTOS = 50;

function UploadForm({ petId, count }: { petId: string; count: number }) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a photo first.");
      const image = await prepareImage(file);
      const params = new URLSearchParams({
        width: String(image.width),
        height: String(image.height),
      });
      if (caption.trim()) params.set("caption", caption.trim());
      return api<PetPhoto>(`/pets/${petId}/photos?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: image.blob,
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["photos", petId] });
      showToast("Photo added.");
      setFile(null);
      setCaption("");
      setError("");
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (uploadError) =>
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the photo.",
      ),
  });

  const full = count >= MAX_PHOTOS;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setError("");
    upload.mutate();
  };

  return (
    <Card className="mb-6">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="photoFile">
              Photo
            </label>
            <input
              id="photoFile"
              ref={inputRef}
              type="file"
              accept="image/*"
              disabled={full}
              className="field-input"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError("");
              }}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="photoCaption">
              Caption (optional)
            </label>
            <input
              id="photoCaption"
              maxLength={200}
              className="field-input"
              placeholder="e.g. First day at the beach"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {full
              ? `This pet has reached the limit of ${MAX_PHOTOS} photos.`
              : `${count} of ${MAX_PHOTOS} photos. Large images are resized automatically.`}
          </p>
          <Button type="submit" disabled={upload.isPending || full}>
            <Upload size={18} />
            {upload.isPending ? "Uploading…" : "Upload photo"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PhotoViewer({
  petId,
  petName,
  photo,
  onClose,
  onDelete,
}: {
  petId: string;
  petName: string;
  photo: PetPhoto;
  onClose: () => void;
  onDelete: () => void;
}) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const [caption, setCaption] = useState(photo.caption ?? "");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () =>
      api<PetPhoto>(`/pets/${petId}/photos/${photo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ caption: caption.trim() || null }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["photos", petId] });
      showToast("Caption saved.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to save the caption.",
        "error",
      ),
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-viewer-title"
    >
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="photo-viewer-title" className="text-lg font-bold">
              {photo.caption || `Photo of ${petName}`}
            </h2>
            <p className="text-sm text-slate-500">
              Added {formatDate(photo.createdAt)}
            </p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close photo"
          >
            <X size={22} />
          </button>
        </div>
        <PetPhotoImage
          petId={petId}
          photoId={photo.id}
          alt={photo.caption || `Photo of ${petName}`}
          className="mx-auto max-h-[60vh] w-auto max-w-full rounded-xl object-contain"
        />
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex-1">
            <label className="field-label" htmlFor="viewerCaption">
              Caption
            </label>
            <input
              id="viewerCaption"
              maxLength={200}
              className="field-input"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save caption"}
          </Button>
          <Button type="button" variant="danger" onClick={onDelete}>
            <Trash2 size={18} /> Delete
          </Button>
        </form>
      </div>
    </div>
  );
}

function PetPhotos({ petId }: { petId: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PetPhoto | null>(null);
  const client = useQueryClient();
  const { showToast } = useToast();
  const petQuery = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => api<Pet>(`/pets/${petId}`),
  });
  const photosQuery = useQuery({
    queryKey: ["photos", petId],
    queryFn: () => api<PetPhoto[]>(`/pets/${petId}/photos`),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api<void>(`/pets/${petId}/photos/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["photos", petId] });
      setDeleting(null);
      setOpenId(null);
      showToast("Photo deleted.");
    },
    onError: (error) =>
      showToast(
        error instanceof Error ? error.message : "Unable to delete the photo.",
        "error",
      ),
  });

  if (petQuery.isLoading || photosQuery.isLoading)
    return <LoadingState label="Loading photos…" />;
  if (petQuery.isError || photosQuery.isError || !petQuery.data)
    return (
      <ErrorState
        message={
          (petQuery.error ?? photosQuery.error) instanceof Error
            ? (petQuery.error ?? (photosQuery.error as Error))?.message
            : undefined
        }
      />
    );
  const pet = petQuery.data;
  const photos = photosQuery.data ?? [];
  const openPhoto = photos.find((photo) => photo.id === openId) ?? null;
  return (
    <>
      <Link
        to={`/pets/${petId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-pine-700"
      >
        <ArrowLeft size={17} /> {pet.name}'s profile
      </Link>
      <PageHeader
        eyebrow="Photo gallery"
        title={`${pet.name}'s photos`}
        description="Keep your favorite moments together. Photos are private to your account."
      />
      <UploadForm petId={petId} count={photos.length} />
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setOpenId(photo.id)}
                className="group block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md"
                aria-label={`View ${photo.caption || `photo ${index + 1}`}`}
              >
                <PetPhotoImage
                  petId={petId}
                  photoId={photo.id}
                  alt={photo.caption || `Photo of ${pet.name}`}
                  className="aspect-square w-full object-cover"
                />
                <span className="block truncate px-3 py-2 text-sm text-slate-600">
                  {photo.caption || formatDate(photo.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No photos yet"
          description={`Upload ${pet.name}'s first photo above.`}
        />
      )}
      {openPhoto && (
        <PhotoViewer
          key={openPhoto.id}
          petId={petId}
          petName={pet.name}
          photo={openPhoto}
          onClose={() => setOpenId(null)}
          onDelete={() => setDeleting(openPhoto)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this photo?"
        description="This permanently removes the photo from the gallery."
        confirmLabel="Delete photo"
        busy={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}

export function PhotosPage() {
  const { petId } = useParams();
  const pets = useQuery({
    queryKey: ["pets"],
    queryFn: () => api<Pet[]>("/pets"),
    enabled: !petId,
  });
  if (petId) return <PetPhotos petId={petId} />;
  return (
    <>
      <PageHeader
        eyebrow="Photo gallery"
        title="Photos"
        description="Choose a pet to view or add photos."
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
                to={`/pets/${pet.id}/photos`}
                className={`${buttonClass("secondary")} mt-2 w-full`}
              >
                <Images size={17} /> Open photos
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Add a pet first"
          description="Photos are stored with a pet profile."
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

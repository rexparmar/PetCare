const MAX_EDGE = 1600;
const MAX_BYTES = 1_400_000;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

// Resizes and re-encodes any browser-readable image as a JPEG that fits the
// server's upload limit, so the API only ever receives small JPEG files.
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/"))
    throw new Error("Choose an image file such as a JPEG, PNG, or WebP photo.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("That image is larger than 25 MB. Choose a smaller one.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "That image could not be read. Try a JPEG, PNG, or WebP photo.",
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Your browser could not process that image.");
  }
  // JPEG has no transparency, so PNGs get a white background.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= MAX_BYTES) return { blob, width, height };
  }
  throw new Error(
    "That image is still too large after compressing it. Try a smaller one.",
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the image."));
    reader.readAsDataURL(blob);
  });
}

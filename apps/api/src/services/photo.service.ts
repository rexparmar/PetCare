import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { getOwnedPet } from "./pet.service.js";

export const MAX_PHOTO_BYTES = 1536 * 1024;
export const MAX_PHOTOS_PER_PET = 50;

// Everything except the image bytes, so list responses stay small.
const photoSelect = {
  id: true,
  petId: true,
  caption: true,
  width: true,
  height: true,
  sizeBytes: true,
  createdAt: true,
} satisfies Prisma.PetPhotoSelect;

export type PhotoUpload = {
  data: unknown;
  width: number;
  height: number;
  caption: string | null;
};

// JPEG files always begin with the bytes FF D8 FF.
const isJpeg = (data: Buffer) =>
  data.length > 4 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;

export async function listPhotos(ownerId: string, petId: string) {
  await getOwnedPet(ownerId, petId);
  return prisma.petPhoto.findMany({
    where: { petId },
    select: photoSelect,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createPhoto(
  ownerId: string,
  petId: string,
  upload: PhotoUpload,
) {
  await getOwnedPet(ownerId, petId);
  const { data } = upload;
  if (!Buffer.isBuffer(data) || data.length === 0)
    throw new AppError(
      400,
      "INVALID_PHOTO",
      "Send the photo as a JPEG image in the request body.",
    );
  if (data.length > MAX_PHOTO_BYTES)
    throw new AppError(413, "PHOTO_TOO_LARGE", "The photo is too large.");
  if (!isJpeg(data))
    throw new AppError(400, "INVALID_PHOTO", "Only JPEG images are accepted.");
  const count = await prisma.petPhoto.count({ where: { petId } });
  if (count >= MAX_PHOTOS_PER_PET)
    throw new AppError(
      409,
      "PHOTO_LIMIT",
      `A pet can have at most ${MAX_PHOTOS_PER_PET} photos.`,
    );
  return prisma.petPhoto.create({
    data: {
      petId,
      caption: upload.caption,
      width: upload.width,
      height: upload.height,
      sizeBytes: data.length,
      data: new Uint8Array(data),
    },
    select: photoSelect,
  });
}

async function assertOwnedPhoto(
  ownerId: string,
  petId: string,
  photoId: string,
) {
  const photo = await prisma.petPhoto.findFirst({
    where: { id: photoId, petId, pet: { ownerId } },
    select: { id: true },
  });
  if (!photo)
    throw new AppError(404, "PHOTO_NOT_FOUND", "Photo was not found.");
}

export async function getPhotoFile(
  ownerId: string,
  petId: string,
  photoId: string,
) {
  const photo = await prisma.petPhoto.findFirst({
    where: { id: photoId, petId, pet: { ownerId } },
    select: { data: true },
  });
  if (!photo)
    throw new AppError(404, "PHOTO_NOT_FOUND", "Photo was not found.");
  return Buffer.from(photo.data);
}

export async function updatePhoto(
  ownerId: string,
  petId: string,
  photoId: string,
  input: { caption: string | null },
) {
  await assertOwnedPhoto(ownerId, petId, photoId);
  return prisma.petPhoto.update({
    where: { id: photoId },
    data: { caption: input.caption },
    select: photoSelect,
  });
}

export async function deletePhoto(
  ownerId: string,
  petId: string,
  photoId: string,
) {
  await assertOwnedPhoto(ownerId, petId, photoId);
  await prisma.petPhoto.delete({ where: { id: photoId } });
}

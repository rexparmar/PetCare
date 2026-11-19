import * as photoService from "../services/photo.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadPhotoQuerySchema } from "../validators/photo.validator.js";

export const list = asyncHandler(async (request, response) => {
  const photos = await photoService.listPhotos(
    request.user!.id,
    String(request.params.petId),
  );
  response.json({ data: photos });
});

export const upload = asyncHandler(async (request, response) => {
  const details = uploadPhotoQuerySchema.parse(request.query);
  const photo = await photoService.createPhoto(
    request.user!.id,
    String(request.params.petId),
    { data: request.body, ...details },
  );
  response.status(201).json({ data: photo });
});

export const file = asyncHandler(async (request, response) => {
  const data = await photoService.getPhotoFile(
    request.user!.id,
    String(request.params.petId),
    String(request.params.photoId),
  );
  response
    .set({
      "Content-Type": "image/jpeg",
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    })
    .end(data);
});

export const update = asyncHandler(async (request, response) => {
  const photo = await photoService.updatePhoto(
    request.user!.id,
    String(request.params.petId),
    String(request.params.photoId),
    request.body,
  );
  response.json({ data: photo });
});

export const remove = asyncHandler(async (request, response) => {
  await photoService.deletePhoto(
    request.user!.id,
    String(request.params.petId),
    String(request.params.photoId),
  );
  response.status(204).end();
});

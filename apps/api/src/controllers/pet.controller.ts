import * as petService from "../services/pet.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  response.json({ data: await petService.listPets(request.user!.id) });
});

export const get = asyncHandler(async (request, response) => {
  response.json({
    data: await petService.getOwnedPet(
      request.user!.id,
      String(request.params.id),
    ),
  });
});

export const create = asyncHandler(async (request, response) => {
  const pet = await petService.createPet(request.user!.id, request.body);
  response.status(201).json({ data: pet });
});

export const update = asyncHandler(async (request, response) => {
  const pet = await petService.updatePet(
    request.user!.id,
    String(request.params.id),
    request.body,
  );
  response.json({ data: pet });
});

export const remove = asyncHandler(async (request, response) => {
  await petService.deletePet(request.user!.id, String(request.params.id));
  response.status(204).end();
});

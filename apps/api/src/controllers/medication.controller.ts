import * as medicationService from "../services/medication.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  const medications = await medicationService.listMedications(
    request.user!.id,
    String(request.params.petId),
  );
  response.json({ data: medications });
});

export const create = asyncHandler(async (request, response) => {
  const medication = await medicationService.createMedication(
    request.user!.id,
    String(request.params.petId),
    request.body,
  );
  response.status(201).json({ data: medication });
});

export const update = asyncHandler(async (request, response) => {
  const medication = await medicationService.updateMedication(
    request.user!.id,
    String(request.params.petId),
    String(request.params.medicationId),
    request.body,
  );
  response.json({ data: medication });
});

export const remove = asyncHandler(async (request, response) => {
  await medicationService.deleteMedication(
    request.user!.id,
    String(request.params.petId),
    String(request.params.medicationId),
  );
  response.status(204).end();
});

import * as clinicService from "../services/clinic.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const directory = asyncHandler(async (_request, response) => {
  response.json({ data: await clinicService.listClinics() });
});

export const get = asyncHandler(async (request, response) => {
  response.json({
    data: await clinicService.getPetClinic(
      request.user!.id,
      String(request.params.petId),
    ),
  });
});

export const link = asyncHandler(async (request, response) => {
  response.json({
    data: await clinicService.linkClinic(
      request.user!.id,
      String(request.params.petId),
      request.body.clinicId,
    ),
  });
});

export const unlink = asyncHandler(async (request, response) => {
  await clinicService.unlinkClinic(
    request.user!.id,
    String(request.params.petId),
  );
  response.status(204).end();
});

export const shareRecords = asyncHandler(async (request, response) => {
  response.json({
    data: await clinicService.shareRecords(
      request.user!.id,
      String(request.params.petId),
    ),
  });
});

export const listRequests = asyncHandler(async (request, response) => {
  response.json({
    data: await clinicService.listRequests(
      request.user!.id,
      String(request.params.petId),
    ),
  });
});

export const submitRequest = asyncHandler(async (request, response) => {
  response.status(201).json({
    data: await clinicService.submitAppointment(
      request.user!.id,
      String(request.params.petId),
      request.body.appointmentId,
    ),
  });
});

import * as appointmentService from "../services/appointment.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  response.json({
    data: await appointmentService.listAppointments(request.user!.id),
  });
});

export const get = asyncHandler(async (request, response) => {
  response.json({
    data: await appointmentService.getOwnedAppointment(
      request.user!.id,
      String(request.params.id),
    ),
  });
});

export const create = asyncHandler(async (request, response) => {
  const appointment = await appointmentService.createAppointment(
    request.user!.id,
    request.body,
  );
  response.status(201).json({ data: appointment });
});

export const update = asyncHandler(async (request, response) => {
  const appointment = await appointmentService.updateAppointment(
    request.user!.id,
    String(request.params.id),
    request.body,
  );
  response.json({ data: appointment });
});

export const remove = asyncHandler(async (request, response) => {
  const appointment = await appointmentService.cancelAppointment(
    request.user!.id,
    String(request.params.id),
  );
  response.json({ data: appointment });
});

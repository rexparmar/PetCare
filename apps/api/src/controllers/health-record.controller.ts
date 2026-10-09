import * as healthService from "../services/health-record.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  const records = await healthService.listHealthRecords(
    request.user!.id,
    String(request.params.petId),
  );
  response.json({ data: records });
});

export const create = asyncHandler(async (request, response) => {
  const record = await healthService.createHealthRecord(
    request.user!.id,
    String(request.params.petId),
    request.body,
  );
  response.status(201).json({ data: record });
});

export const update = asyncHandler(async (request, response) => {
  const record = await healthService.updateHealthRecord(
    request.user!.id,
    String(request.params.petId),
    String(request.params.recordId),
    request.body,
  );
  response.json({ data: record });
});

export const remove = asyncHandler(async (request, response) => {
  await healthService.deleteHealthRecord(
    request.user!.id,
    String(request.params.petId),
    String(request.params.recordId),
  );
  response.status(204).end();
});

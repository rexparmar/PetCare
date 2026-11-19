import * as activityService from "../services/activity.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  const activities = await activityService.listActivities(
    request.user!.id,
    String(request.params.petId),
  );
  response.json({ data: activities });
});

export const create = asyncHandler(async (request, response) => {
  const activity = await activityService.createActivity(
    request.user!.id,
    String(request.params.petId),
    request.body,
  );
  response.status(201).json({ data: activity });
});

export const update = asyncHandler(async (request, response) => {
  const activity = await activityService.updateActivity(
    request.user!.id,
    String(request.params.petId),
    String(request.params.activityId),
    request.body,
  );
  response.json({ data: activity });
});

export const remove = asyncHandler(async (request, response) => {
  await activityService.deleteActivity(
    request.user!.id,
    String(request.params.petId),
    String(request.params.activityId),
  );
  response.status(204).end();
});

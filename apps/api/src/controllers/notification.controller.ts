import * as notificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const list = asyncHandler(async (request, response) => {
  response.json({
    data: await notificationService.listNotifications(request.user!.id),
  });
});

export const read = asyncHandler(async (request, response) => {
  response.json({
    data: await notificationService.markRead(
      request.user!.id,
      String(request.params.id),
    ),
  });
});

export const readAll = asyncHandler(async (request, response) => {
  const updated = await notificationService.markAllRead(request.user!.id);
  response.json({ data: { updated } });
});

export const getPreferences = asyncHandler(async (request, response) => {
  response.json({
    data: await notificationService.getPreferences(request.user!.id),
  });
});

export const updatePreferences = asyncHandler(async (request, response) => {
  response.json({
    data: await notificationService.updatePreferences(
      request.user!.id,
      request.body,
    ),
  });
});

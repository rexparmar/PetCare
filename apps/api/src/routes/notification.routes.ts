import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../validators/common.js";
import { updatePreferencesSchema } from "../validators/notification.validator.js";

export const notificationRouter = Router();

notificationRouter.get("/", notificationController.list);
notificationRouter.get("/preferences", notificationController.getPreferences);
notificationRouter.patch(
  "/preferences",
  csrfProtection,
  validate({ body: updatePreferencesSchema }),
  notificationController.updatePreferences,
);
notificationRouter.post(
  "/read-all",
  csrfProtection,
  notificationController.readAll,
);
notificationRouter.post(
  "/:id/read",
  csrfProtection,
  validate({ params: idParamsSchema }),
  notificationController.read,
);

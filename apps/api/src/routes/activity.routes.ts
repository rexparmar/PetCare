import { Router } from "express";
import * as activityController from "../controllers/activity.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import {
  activityParamsSchema,
  petIdParamsSchema,
} from "../validators/common.js";
import {
  createActivitySchema,
  updateActivitySchema,
} from "../validators/activity.validator.js";

export const activityRouter = Router({ mergeParams: true });

activityRouter.get(
  "/",
  validate({ params: petIdParamsSchema }),
  activityController.list,
);
activityRouter.post(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema, body: createActivitySchema }),
  activityController.create,
);
activityRouter.patch(
  "/:activityId",
  csrfProtection,
  validate({ params: activityParamsSchema, body: updateActivitySchema }),
  activityController.update,
);
activityRouter.delete(
  "/:activityId",
  csrfProtection,
  validate({ params: activityParamsSchema }),
  activityController.remove,
);

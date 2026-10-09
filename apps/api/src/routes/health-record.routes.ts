import { Router } from "express";
import * as healthController from "../controllers/health-record.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import {
  healthRecordParamsSchema,
  petIdParamsSchema,
} from "../validators/common.js";
import {
  createHealthRecordSchema,
  updateHealthRecordSchema,
} from "../validators/health-record.validator.js";

export const healthRecordRouter = Router({ mergeParams: true });

healthRecordRouter.get(
  "/",
  validate({ params: petIdParamsSchema }),
  healthController.list,
);
healthRecordRouter.post(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema, body: createHealthRecordSchema }),
  healthController.create,
);
healthRecordRouter.patch(
  "/:recordId",
  csrfProtection,
  validate({
    params: healthRecordParamsSchema,
    body: updateHealthRecordSchema,
  }),
  healthController.update,
);
healthRecordRouter.delete(
  "/:recordId",
  csrfProtection,
  validate({ params: healthRecordParamsSchema }),
  healthController.remove,
);

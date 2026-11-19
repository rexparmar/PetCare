import { Router } from "express";
import * as medicationController from "../controllers/medication.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import {
  medicationParamsSchema,
  petIdParamsSchema,
} from "../validators/common.js";
import {
  createMedicationSchema,
  updateMedicationSchema,
} from "../validators/medication.validator.js";

export const medicationRouter = Router({ mergeParams: true });

medicationRouter.get(
  "/",
  validate({ params: petIdParamsSchema }),
  medicationController.list,
);
medicationRouter.post(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema, body: createMedicationSchema }),
  medicationController.create,
);
medicationRouter.patch(
  "/:medicationId",
  csrfProtection,
  validate({
    params: medicationParamsSchema,
    body: updateMedicationSchema,
  }),
  medicationController.update,
);
medicationRouter.delete(
  "/:medicationId",
  csrfProtection,
  validate({ params: medicationParamsSchema }),
  medicationController.remove,
);

import { Router } from "express";
import * as clinicController from "../controllers/clinic.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { petIdParamsSchema } from "../validators/common.js";
import {
  linkClinicSchema,
  submitRequestSchema,
} from "../validators/clinic.validator.js";

// Clinics available through the clinic interface.
export const clinicDirectoryRouter = Router();
clinicDirectoryRouter.get("/", clinicController.directory);

// A pet's clinic link and its requests: /pets/:petId/clinic
export const clinicRouter = Router({ mergeParams: true });

clinicRouter.get(
  "/",
  validate({ params: petIdParamsSchema }),
  clinicController.get,
);
clinicRouter.put(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema, body: linkClinicSchema }),
  clinicController.link,
);
clinicRouter.delete(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema }),
  clinicController.unlink,
);
clinicRouter.post(
  "/share-records",
  csrfProtection,
  validate({ params: petIdParamsSchema }),
  clinicController.shareRecords,
);
clinicRouter.get(
  "/requests",
  validate({ params: petIdParamsSchema }),
  clinicController.listRequests,
);
clinicRouter.post(
  "/requests",
  csrfProtection,
  validate({ params: petIdParamsSchema, body: submitRequestSchema }),
  clinicController.submitRequest,
);

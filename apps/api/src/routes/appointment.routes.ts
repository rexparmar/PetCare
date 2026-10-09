import { Router } from "express";
import * as appointmentController from "../controllers/appointment.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validators/appointment.validator.js";
import { idParamsSchema } from "../validators/common.js";

export const appointmentRouter = Router();

appointmentRouter.get("/", appointmentController.list);
appointmentRouter.post(
  "/",
  csrfProtection,
  validate({ body: createAppointmentSchema }),
  appointmentController.create,
);
appointmentRouter.get(
  "/:id",
  validate({ params: idParamsSchema }),
  appointmentController.get,
);
appointmentRouter.patch(
  "/:id",
  csrfProtection,
  validate({ params: idParamsSchema, body: updateAppointmentSchema }),
  appointmentController.update,
);
appointmentRouter.delete(
  "/:id",
  csrfProtection,
  validate({ params: idParamsSchema }),
  appointmentController.remove,
);

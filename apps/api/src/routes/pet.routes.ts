import { Router } from "express";
import * as petController from "../controllers/pet.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../validators/common.js";
import {
  createPetSchema,
  updatePetSchema,
} from "../validators/pet.validator.js";

export const petRouter = Router();

petRouter.get("/", petController.list);
petRouter.post(
  "/",
  csrfProtection,
  validate({ body: createPetSchema }),
  petController.create,
);
petRouter.get("/:id", validate({ params: idParamsSchema }), petController.get);
petRouter.patch(
  "/:id",
  csrfProtection,
  validate({ params: idParamsSchema, body: updatePetSchema }),
  petController.update,
);
petRouter.delete(
  "/:id",
  csrfProtection,
  validate({ params: idParamsSchema }),
  petController.remove,
);

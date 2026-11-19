import express, { Router } from "express";
import type { RequestHandler } from "express";
import * as photoController from "../controllers/photo.controller.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { MAX_PHOTO_BYTES } from "../services/photo.service.js";
import { AppError } from "../utils/app-error.js";
import { petIdParamsSchema, photoParamsSchema } from "../validators/common.js";
import { updatePhotoSchema } from "../validators/photo.validator.js";

export const photoRouter = Router({ mergeParams: true });

// Photos are uploaded as the raw JPEG request body, so the small JSON body
// limit used by the rest of the API does not apply to them.
const parseJpeg = express.raw({ type: "image/jpeg", limit: MAX_PHOTO_BYTES });
const readJpegBody: RequestHandler = (request, response, next) => {
  parseJpeg(request, response, (error?: unknown) => {
    if (!error) return next();
    const status = (error as { status?: number }).status;
    next(
      status === 413
        ? new AppError(413, "PHOTO_TOO_LARGE", "The photo is too large.")
        : new AppError(400, "INVALID_PHOTO", "The photo could not be read."),
    );
  });
};

photoRouter.get(
  "/",
  validate({ params: petIdParamsSchema }),
  photoController.list,
);
photoRouter.post(
  "/",
  csrfProtection,
  validate({ params: petIdParamsSchema }),
  readJpegBody,
  photoController.upload,
);
photoRouter.get(
  "/:photoId/file",
  validate({ params: photoParamsSchema }),
  photoController.file,
);
photoRouter.patch(
  "/:photoId",
  csrfProtection,
  validate({ params: photoParamsSchema, body: updatePhotoSchema }),
  photoController.update,
);
photoRouter.delete(
  "/:photoId",
  csrfProtection,
  validate({ params: photoParamsSchema }),
  photoController.remove,
);

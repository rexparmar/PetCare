import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

type RequestSchemas = Partial<Record<"body" | "params" | "query", ZodType>>;

export const validate = (schemas: RequestSchemas): RequestHandler => {
  return (request, _response, next) => {
    for (const key of Object.keys(schemas) as Array<keyof RequestSchemas>) {
      const result = schemas[key]!.safeParse(request[key]);
      if (!result.success) {
        return next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "Request validation failed.",
            result.error.flatten(),
          ),
        );
      }
      // Express exposes these objects as mutable values at runtime.
      (request as unknown as Record<string, unknown>)[key] = result.data;
    }
    next();
  };
};

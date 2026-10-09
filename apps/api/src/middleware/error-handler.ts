import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      404,
      "NOT_FOUND",
      `Route ${request.method} ${request.path} was not found.`,
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  void _next;
  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.flatten(),
      },
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    response.status(409).json({
      error: {
        code: "CONFLICT",
        message: "A record with that value already exists.",
      },
    });
    return;
  }

  request.log?.error({ err: error }, "Unhandled request error");
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      ...(env.NODE_ENV === "development" && error instanceof Error
        ? { details: error.message }
        : {}),
    },
  });
};

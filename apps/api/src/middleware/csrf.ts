import { randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const CSRF_COOKIE = "petcare_csrf";

const cookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 1000,
};

export function issueCsrfToken(response: Response): string {
  const token = randomBytes(32).toString("hex");
  response.cookie(CSRF_COOKIE, token, cookieOptions);
  return token;
}

export const csrfProtection: RequestHandler = (request, _response, next) => {
  const cookieToken = request.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = request.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    next(new AppError(403, "CSRF_INVALID", "A valid CSRF token is required."));
    return;
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (
    cookieBuffer.length !== headerBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    next(new AppError(403, "CSRF_INVALID", "A valid CSRF token is required."));
    return;
  }

  next();
};

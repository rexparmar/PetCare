import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { publicUserSelect } from "../utils/selects.js";
import { AppError } from "../utils/app-error.js";
import { SESSION_COOKIE } from "../services/auth.service.js";

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token)
      throw new AppError(401, "UNAUTHENTICATED", "Authentication is required.");

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      select: { id: true, expiresAt: true, user: { select: publicUserSelect } },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      throw new AppError(
        401,
        "UNAUTHENTICATED",
        "Your session is invalid or has expired.",
      );
    }

    request.user = session.user;
    request.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
};

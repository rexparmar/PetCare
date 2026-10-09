import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { publicUserSelect } from "../utils/selects.js";

export const SESSION_COOKIE = "petcare_session";

const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function startSession(userId: string, response: Response) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + sessionCookieOptions.maxAge);
  await prisma.session.create({ data: { tokenHash, userId, expiresAt } });
  response.cookie(SESSION_COOKIE, token, sessionCookieOptions);
}

export async function registerUser(
  input: { fullName: string; email: string; password: string },
  response: Response,
) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing)
    throw new AppError(
      409,
      "EMAIL_IN_USE",
      "An account already exists for this email.",
    );

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  const user = await prisma.user.create({
    data: { fullName: input.fullName.trim(), email, passwordHash },
    select: publicUserSelect,
  });
  await startSession(user.id, response);
  return user;
}

export async function loginUser(
  input: { email: string; password: string },
  response: Response,
) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(input.email) },
  });
  const valid = user
    ? await argon2.verify(user.passwordHash, input.password)
    : false;
  if (!user || !valid)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );

  await startSession(user.id, response);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function logoutUser(
  sessionId: string | undefined,
  response: Response,
) {
  if (sessionId) await prisma.session.deleteMany({ where: { id: sessionId } });
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

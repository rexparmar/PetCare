import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: [resolve(process.cwd(), "../../.env"), resolve(process.cwd(), ".env")],
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;

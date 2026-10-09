import type { ApiErrorShape } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function csrfToken() {
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
  });
  if (!response.ok)
    throw new ApiError(
      "Unable to initialize a secure request.",
      response.status,
      "CSRF_SETUP",
    );
  const payload = (await response.json()) as { data: { csrfToken: string } };
  return payload.data.csrfToken;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-Token", await csrfToken());
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    let payload: ApiErrorShape | undefined;
    try {
      payload = (await response.json()) as ApiErrorShape;
    } catch {
      // The fallback below covers non-JSON infrastructure errors.
    }
    throw new ApiError(
      payload?.error.message ?? "Something went wrong. Please try again.",
      response.status,
      payload?.error.code ?? "REQUEST_FAILED",
      payload?.error.details,
    );
  }
  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

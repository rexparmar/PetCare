import type { RequestHandler } from "express";
import { issueCsrfToken } from "../middleware/csrf.js";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const getCsrf: RequestHandler = (_request, response) => {
  response.json({ data: { csrfToken: issueCsrfToken(response) } });
};

export const register = asyncHandler(async (request, response) => {
  const user = await registerUser(request.body, response);
  response.status(201).json({ data: user });
});

export const login = asyncHandler(async (request, response) => {
  const user = await loginUser(request.body, response);
  response.json({ data: user });
});

export const logout = asyncHandler(async (request, response) => {
  await logoutUser(request.sessionId, response);
  response.status(204).end();
});

export const me: RequestHandler = (request, response) => {
  response.json({ data: request.user });
};

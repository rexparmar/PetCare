import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts.",
    },
  },
});

authRouter.get("/csrf", authController.getCsrf);
authRouter.post(
  "/register",
  authLimiter,
  csrfProtection,
  validate({ body: registerSchema }),
  authController.register,
);
authRouter.post(
  "/login",
  authLimiter,
  csrfProtection,
  validate({ body: loginSchema }),
  authController.login,
);
authRouter.post("/logout", requireAuth, csrfProtection, authController.logout);
authRouter.get("/me", requireAuth, authController.me);

import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<
        User,
        "id" | "fullName" | "email" | "createdAt" | "updatedAt"
      >;
      sessionId?: string;
    }
  }
}

export {};

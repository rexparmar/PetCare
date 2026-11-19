import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { activityRouter } from "./activity.routes.js";
import { appointmentRouter } from "./appointment.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRecordRouter } from "./health-record.routes.js";
import { medicationRouter } from "./medication.routes.js";
import { petRouter } from "./pet.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ data: { status: "ok" } });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/pets/:petId/health-records", requireAuth, healthRecordRouter);
apiRouter.use("/pets/:petId/medications", requireAuth, medicationRouter);
apiRouter.use("/pets/:petId/activities", requireAuth, activityRouter);
apiRouter.use("/pets", requireAuth, petRouter);
apiRouter.use("/appointments", requireAuth, appointmentRouter);
apiRouter.get("/dashboard", requireAuth, dashboard);

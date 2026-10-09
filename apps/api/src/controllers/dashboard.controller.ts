import { getDashboard } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboard = asyncHandler(async (request, response) => {
  response.json({ data: await getDashboard(request.user!.id) });
});

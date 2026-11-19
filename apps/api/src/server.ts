import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { startReminderScheduler } from "./services/reminder-scheduler.js";

const server = app.listen(env.PORT, () => {
  console.log(`PetCare API listening on http://localhost:${env.PORT}`);
});
const stopReminders = startReminderScheduler();

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down.`);
  stopReminders();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

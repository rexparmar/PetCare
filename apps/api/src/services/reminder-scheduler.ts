import {
  generateReminders,
  pruneOldNotifications,
} from "./notification.service.js";

const PRUNE_EVERY_MS = 6 * 60 * 60_000;

// Runs inside the API process: every minute it creates any reminders that
// became due, so they are waiting for the owner even if no page is open.
export function startReminderScheduler(intervalMs = 60_000) {
  let lastPrune = 0;
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      await generateReminders(now);
      if (now.getTime() - lastPrune >= PRUNE_EVERY_MS) {
        lastPrune = now.getTime();
        await pruneOldNotifications(now);
      }
    } catch (error) {
      console.error("Reminder scheduler failed:", error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

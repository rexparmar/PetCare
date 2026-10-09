import { defineConfig, devices } from "@playwright/test";

const databaseUrl =
  process.env.DATABASE_URL_TEST ??
  "postgresql://petcare:petcare@localhost:5433/petcare_test?schema=public";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5173", trace: "on-first-retry" },
  webServer: [
    {
      command: "npm run start -w @petcare/api",
      cwd: "../..",
      url: "http://127.0.0.1:4000/api/health",
      reuseExistingServer: true,
      env: {
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
        PORT: "4000",
        WEB_ORIGIN: "http://127.0.0.1:5173",
        LOG_LEVEL: "silent",
      },
    },
    {
      command: "npm run dev -w @petcare/web -- --host 127.0.0.1",
      cwd: "../..",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: true,
      env: { VITE_API_URL: "http://127.0.0.1:4000/api" },
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

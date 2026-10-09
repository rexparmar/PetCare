import { expect, test } from "@playwright/test";

test("user completes the Release 1 care workflow", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Taylor Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByLabel("Confirm password").fill("StrongPass123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(
    page.getByRole("heading", { name: /welcome back, taylor/i }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /add a pet/i })
    .first()
    .click();
  await page.getByLabel("Pet name").fill("Milo");
  await page.getByLabel("Species").fill("Dog");
  await page.getByLabel("Breed").fill("Beagle");
  await page.getByLabel("Date of birth").fill("2021-04-12");
  await page.getByLabel("Gender").selectOption("MALE");
  await page.getByLabel(/weight/i).fill("14.5");
  await page.getByRole("button", { name: /create pet profile/i }).click();
  await expect(page.getByRole("heading", { name: "Milo" })).toBeVisible();

  await page.getByRole("link", { name: /manage health records/i }).click();
  await page
    .getByRole("button", { name: /add record/i })
    .first()
    .click();
  await page.getByLabel("Record type").selectOption("VACCINATION");
  await page.getByLabel("Title").fill("Rabies booster");
  await page.getByLabel("Date *").fill("2026-09-15");
  await page.getByLabel("Veterinarian").fill("Dr. Rivera");
  await page.getByRole("button", { name: /save record/i }).click();
  await expect(page.getByText("Rabies booster")).toBeVisible();

  await page.getByRole("link", { name: /milo's profile/i }).click();
  await page.getByRole("link", { name: /schedule appointment/i }).click();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const local = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Date and time *").fill(local);
  await page.getByLabel("Clinic or veterinarian *").fill("HappyPaws Clinic");
  await page.getByLabel("Reason *").fill("Annual wellness exam");
  await page.getByRole("button", { name: /schedule appointment/i }).click();
  await expect(page.getByText(/milo · annual wellness exam/i)).toBeVisible();

  await page.getByRole("link", { name: "Overview" }).click();
  await expect(page.getByText("Rabies booster")).toBeVisible();
  await expect(
    page.getByText("Annual wellness exam", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-visual.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("StrongPass123");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(
    page.getByRole("heading", { name: /welcome back, taylor/i }),
  ).toBeVisible();
});

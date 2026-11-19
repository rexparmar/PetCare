import { describe, expect, it } from "vitest";
import {
  appointmentReminderDue,
  dueMedicationDoses,
} from "../src/services/reminder-rules.js";
import {
  REVIEW_DELAY_MS,
  SimulatedClinicGateway,
} from "../src/services/clinic-gateway.js";
import {
  isValidTimeZone,
  localClock,
  localWeekday,
} from "../src/utils/time.js";

const medication = {
  timesOfDay: ["08:00", "20:00"],
  startDate: new Date("2026-11-01T00:00:00.000Z"),
  endDate: null as Date | null,
};

describe("time helpers", () => {
  it("reads the wall clock in a time zone", () => {
    // 13:05 UTC is 08:05 in Toronto (EST) on the same day.
    const now = new Date("2026-11-19T13:05:00.000Z");
    expect(localClock(now, "America/Toronto")).toEqual({
      date: "2026-11-19",
      minutes: 8 * 60 + 5,
    });
    expect(localClock(now, "UTC").minutes).toBe(13 * 60 + 5);
    expect(
      localClock(new Date("2026-11-19T02:00:00.000Z"), "America/Toronto").date,
    ).toBe("2026-11-18");
    expect(localWeekday(now, "UTC")).toBe(4);
  });

  it("validates time zone names", () => {
    expect(isValidTimeZone("America/Toronto")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
  });
});

describe("medication reminders", () => {
  const zone = "America/Toronto";

  it("is due from the scheduled time until the grace period ends", () => {
    const at = (iso: string) =>
      dueMedicationDoses(medication, new Date(iso), zone);
    expect(at("2026-11-19T12:59:00.000Z")).toHaveLength(0); // 07:59 local
    expect(at("2026-11-19T13:00:00.000Z").map((dose) => dose.time)).toEqual([
      "08:00",
    ]);
    expect(at("2026-11-19T14:00:00.000Z")).toHaveLength(1); // 09:00 local
    expect(at("2026-11-19T14:01:00.000Z")).toHaveLength(0); // 09:01 local
    expect(at("2026-11-20T01:30:00.000Z").map((dose) => dose.time)).toEqual([
      "20:00",
    ]);
  });

  it("reports a stable key date and the due time", () => {
    const [dose] = dueMedicationDoses(
      medication,
      new Date("2026-11-19T13:20:30.000Z"),
      zone,
    );
    expect(dose.date).toBe("2026-11-19");
    expect(dose.dueAt.toISOString()).toBe("2026-11-19T13:00:00.000Z");
  });

  it("respects the start and end dates", () => {
    const now = new Date("2026-11-19T13:00:00.000Z");
    expect(
      dueMedicationDoses(
        { ...medication, startDate: new Date("2026-11-20T00:00:00.000Z") },
        now,
        zone,
      ),
    ).toHaveLength(0);
    expect(
      dueMedicationDoses(
        { ...medication, endDate: new Date("2026-11-18T00:00:00.000Z") },
        now,
        zone,
      ),
    ).toHaveLength(0);
    expect(
      dueMedicationDoses(
        { ...medication, endDate: new Date("2026-11-19T00:00:00.000Z") },
        now,
        zone,
      ),
    ).toHaveLength(1);
  });

  it("does nothing for as-needed medications", () => {
    expect(
      dueMedicationDoses(
        { ...medication, timesOfDay: [] },
        new Date("2026-11-19T13:00:00.000Z"),
        zone,
      ),
    ).toHaveLength(0);
  });
});

describe("appointment reminders", () => {
  const now = new Date("2026-11-19T12:00:00.000Z");
  it("is due only inside the lead window", () => {
    const hours = (value: number) =>
      new Date(now.getTime() + value * 3_600_000);
    expect(appointmentReminderDue(hours(2), now, 24)).toBe(true);
    expect(appointmentReminderDue(hours(24), now, 24)).toBe(true);
    expect(appointmentReminderDue(hours(25), now, 24)).toBe(false);
    expect(appointmentReminderDue(hours(-1), now, 24)).toBe(false);
  });
});

describe("simulated clinic gateway", () => {
  const gateway = new SimulatedClinicGateway();
  const payload = (scheduledAt: string) => ({
    petName: "Milo",
    species: "Dog",
    reason: "Checkup",
    scheduledAt: new Date(scheduledAt),
    ownerName: "Alex",
  });

  it("lists the directory", async () => {
    const clinics = await gateway.listClinics();
    expect(clinics.length).toBeGreaterThanOrEqual(3);
    expect(await gateway.getClinic("happypaws-downtown")).not.toBeNull();
    expect(await gateway.getClinic("missing")).toBeNull();
  });

  it("confirms requests inside opening hours and declines outside them", async () => {
    // Tuesday 15:00 UTC is 10:00 in Toronto.
    const open = await gateway.submitAppointment(
      "happypaws-downtown",
      payload("2026-11-24T15:00:00.000Z"),
    );
    expect(open.status).toBe("CONFIRMED");
    expect(open.externalReference).toMatch(/^SIM-/);

    // Sunday is closed for the downtown clinic.
    const closed = await gateway.submitAppointment(
      "happypaws-downtown",
      payload("2026-11-22T15:00:00.000Z"),
    );
    expect(closed.status).toBe("DECLINED");
    expect(closed.message).toContain("closed");

    // Tuesday 23:00 UTC is 18:00 in Toronto, after the downtown clinic closes.
    const late = await gateway.submitAppointment(
      "happypaws-downtown",
      payload("2026-11-24T23:00:00.000Z"),
    );
    expect(late.status).toBe("DECLINED");
  });

  it("holds review-clinic requests as pending, then confirms them", async () => {
    const scheduledAt = new Date("2026-11-24T15:00:00.000Z");
    const submitted = await gateway.submitAppointment("riverside-vet", {
      ...payload("2026-11-24T15:00:00.000Z"),
    });
    expect(submitted.status).toBe("PENDING");

    const submittedAt = new Date("2026-11-19T12:00:00.000Z");
    const soon = await gateway.checkRequest(
      "riverside-vet",
      submitted.externalReference,
      { submittedAt, scheduledAt },
      new Date(submittedAt.getTime() + REVIEW_DELAY_MS - 1000),
    );
    expect(soon.status).toBe("PENDING");
    const later = await gateway.checkRequest(
      "riverside-vet",
      submitted.externalReference,
      { submittedAt, scheduledAt },
      new Date(submittedAt.getTime() + REVIEW_DELAY_MS),
    );
    expect(later.status).toBe("CONFIRMED");
  });

  it("acknowledges shared records", async () => {
    const receipt = await gateway.receiveRecords("happypaws-downtown", {
      petName: "Milo",
      species: "Dog",
      breed: null,
      records: [
        {
          type: "VACCINATION",
          title: "Rabies",
          date: "2026-09-15",
          veterinarian: null,
          description: null,
        },
      ],
    });
    expect(receipt.receivedCount).toBe(1);
    expect(receipt.receiptId).toMatch(/^REC-/);
  });
});

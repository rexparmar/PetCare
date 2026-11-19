import request, { type SuperAgentTest } from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

async function csrf(agent: SuperAgentTest) {
  const response = await agent.get("/api/auth/csrf").expect(200);
  return response.body.data.csrfToken as string;
}

async function register(
  agent: SuperAgentTest,
  email = "alex@example.com",
  fullName = "Alex Morgan",
) {
  const token = await csrf(agent);
  return agent
    .post("/api/auth/register")
    .set("x-csrf-token", token)
    .send({
      fullName,
      email,
      password: "StrongPass123",
      confirmPassword: "StrongPass123",
    })
    .expect(201);
}

async function createPet(agent: SuperAgentTest, name = "Milo") {
  const token = await csrf(agent);
  return agent
    .post("/api/pets")
    .set("x-csrf-token", token)
    .send({
      name,
      species: "Dog",
      breed: "Beagle",
      dateOfBirth: "2021-04-12",
      gender: "MALE",
      weight: 14.5,
      medicalNotes: "Sensitive stomach",
    })
    .expect(201);
}

beforeEach(async () => {
  await prisma.petPhoto.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authentication", () => {
  it("registers a user and returns a protected account without a password hash", async () => {
    const agent = request.agent(app);
    const response = await register(agent);
    expect(response.body.data).toMatchObject({
      fullName: "Alex Morgan",
      email: "alex@example.com",
    });
    expect(response.body.data).not.toHaveProperty("passwordHash");
    expect(
      await prisma.user.findUnique({ where: { email: "alex@example.com" } }),
    ).toMatchObject({
      email: "alex@example.com",
    });

    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.data.email).toBe("alex@example.com");
  });

  it("rejects duplicate emails case-insensitively", async () => {
    await register(request.agent(app));
    const other = request.agent(app);
    const token = await csrf(other);
    const response = await other
      .post("/api/auth/register")
      .set("x-csrf-token", token)
      .send({
        fullName: "Other User",
        email: "ALEX@example.com",
        password: "StrongPass123",
        confirmPassword: "StrongPass123",
      })
      .expect(409);
    expect(response.body.error.code).toBe("EMAIL_IN_USE");
  });

  it("logs in with valid credentials and rejects an incorrect password", async () => {
    await register(request.agent(app));
    const agent = request.agent(app);
    let token = await csrf(agent);
    await agent
      .post("/api/auth/login")
      .set("x-csrf-token", token)
      .send({ email: "alex@example.com", password: "wrong" })
      .expect(401);

    token = await csrf(agent);
    const response = await agent
      .post("/api/auth/login")
      .set("x-csrf-token", token)
      .send({ email: "alex@example.com", password: "StrongPass123" })
      .expect(200);
    expect(response.body.data.email).toBe("alex@example.com");
  });

  it("protects private routes, enforces CSRF, and logs out", async () => {
    await request(app).get("/api/pets").expect(401);
    const agent = request.agent(app);
    await register(agent);
    await agent.post("/api/pets").send({}).expect(403);
    const token = await csrf(agent);
    await agent.post("/api/auth/logout").set("x-csrf-token", token).expect(204);
    await agent.get("/api/auth/me").expect(401);
  });
});

describe("pets", () => {
  it("creates, lists, retrieves, updates, and deletes a pet", async () => {
    const agent = request.agent(app);
    await register(agent);
    const created = await createPet(agent);
    const petId = created.body.data.id;

    const list = await agent.get("/api/pets").expect(200);
    expect(list.body.data).toHaveLength(1);
    await agent.get(`/api/pets/${petId}`).expect(200);

    let token = await csrf(agent);
    const updated = await agent
      .patch(`/api/pets/${petId}`)
      .set("x-csrf-token", token)
      .send({ weight: 15.2, medicalNotes: "Doing well" })
      .expect(200);
    expect(updated.body.data.weight).toBe(15.2);

    token = await csrf(agent);
    await agent
      .delete(`/api/pets/${petId}`)
      .set("x-csrf-token", token)
      .expect(204);
    await agent.get(`/api/pets/${petId}`).expect(404);
  });

  it("does not expose another user’s pet", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = await createPet(owner);

    const outsider = request.agent(app);
    await register(outsider, "jamie@example.com", "Jamie Lee");
    await outsider.get(`/api/pets/${pet.body.data.id}`).expect(404);
    const token = await csrf(outsider);
    await outsider
      .patch(`/api/pets/${pet.body.data.id}`)
      .set("x-csrf-token", token)
      .send({ name: "Stolen" })
      .expect(404);
  });
});

describe("health records", () => {
  it("creates, lists chronologically, updates, and deletes a record", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = await createPet(agent);
    const petId = pet.body.data.id;
    let token = await csrf(agent);
    const created = await agent
      .post(`/api/pets/${petId}/health-records`)
      .set("x-csrf-token", token)
      .send({
        recordType: "VACCINATION",
        title: "Rabies booster",
        description: "Three-year booster",
        recordDate: "2026-09-15",
        veterinarianName: "Dr. Rivera",
      })
      .expect(201);

    const list = await agent
      .get(`/api/pets/${petId}/health-records`)
      .expect(200);
    expect(list.body.data[0].title).toBe("Rabies booster");

    token = await csrf(agent);
    await agent
      .patch(`/api/pets/${petId}/health-records/${created.body.data.id}`)
      .set("x-csrf-token", token)
      .send({ title: "Rabies vaccination" })
      .expect(200);
    token = await csrf(agent);
    await agent
      .delete(`/api/pets/${petId}/health-records/${created.body.data.id}`)
      .set("x-csrf-token", token)
      .expect(204);
    expect(
      (await agent.get(`/api/pets/${petId}/health-records`)).body.data,
    ).toHaveLength(0);
  });

  it("rejects cross-user health record access", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = await createPet(owner);
    const outsider = request.agent(app);
    await register(outsider, "jamie@example.com");
    const token = await csrf(outsider);
    await outsider
      .post(`/api/pets/${pet.body.data.id}/health-records`)
      .set("x-csrf-token", token)
      .send({ recordType: "OTHER", title: "Private", recordDate: "2026-01-01" })
      .expect(404);
  });
});

describe("medications", () => {
  const medication = {
    name: "Amoxicillin",
    dosage: "1 tablet (250 mg)",
    frequency: "TWICE_DAILY",
    timesOfDay: ["20:00", "08:00"],
    startDate: "2026-11-01",
    endDate: "2026-11-14",
    instructions: "Give with food",
  };

  async function addMedication(
    agent: SuperAgentTest,
    petId: string,
    body: Record<string, unknown> = {},
  ) {
    const token = await csrf(agent);
    return agent
      .post(`/api/pets/${petId}/medications`)
      .set("x-csrf-token", token)
      .send({ ...medication, ...body });
  }

  async function changeMedication(
    agent: SuperAgentTest,
    petId: string,
    id: string,
    body: Record<string, unknown>,
  ) {
    const token = await csrf(agent);
    return agent
      .patch(`/api/pets/${petId}/medications/${id}`)
      .set("x-csrf-token", token)
      .send(body);
  }

  async function removeMedication(
    agent: SuperAgentTest,
    petId: string,
    id: string,
  ) {
    const token = await csrf(agent);
    return agent
      .delete(`/api/pets/${petId}/medications/${id}`)
      .set("x-csrf-token", token);
  }

  it("creates, lists, updates, stops, and deletes a medication", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;

    const created = await addMedication(agent, pet.id);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: "Amoxicillin",
      frequency: "TWICE_DAILY",
      timesOfDay: ["08:00", "20:00"],
      isActive: true,
    });

    const list = await agent.get(`/api/pets/${pet.id}/medications`).expect(200);
    expect(list.body.data).toHaveLength(1);

    const updated = await changeMedication(
      agent,
      pet.id,
      created.body.data.id,
      { dosage: "2 tablets", isActive: false },
    );
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      dosage: "2 tablets",
      isActive: false,
      timesOfDay: ["08:00", "20:00"],
    });

    const removed = await removeMedication(agent, pet.id, created.body.data.id);
    expect(removed.status).toBe(204);
    const empty = await agent
      .get(`/api/pets/${pet.id}/medications`)
      .expect(200);
    expect(empty.body.data).toHaveLength(0);
  });

  it("rejects schedules that do not match the frequency or dates", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;

    expect(
      (await addMedication(agent, pet.id, { timesOfDay: ["08:00"] })).status,
    ).toBe(400);
    expect(
      (await addMedication(agent, pet.id, { timesOfDay: ["08:00", "08:00"] }))
        .status,
    ).toBe(400);
    expect(
      (await addMedication(agent, pet.id, { timesOfDay: ["8am", "20:00"] }))
        .status,
    ).toBe(400);
    expect(
      (await addMedication(agent, pet.id, { endDate: "2026-10-01" })).status,
    ).toBe(400);
    expect(
      (
        await addMedication(agent, pet.id, {
          frequency: "AS_NEEDED",
          timesOfDay: [],
        })
      ).status,
    ).toBe(201);
  });

  it("rejects cross-user medication access", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = (await createPet(owner)).body.data;
    const created = await addMedication(owner, pet.id);
    expect(created.status).toBe(201);

    const other = request.agent(app);
    await register(other, "sam@example.com", "Sam Lee");
    await other.get(`/api/pets/${pet.id}/medications`).expect(404);
    expect(
      (
        await changeMedication(other, pet.id, created.body.data.id, {
          isActive: false,
        })
      ).status,
    ).toBe(404);
    expect(
      (await removeMedication(other, pet.id, created.body.data.id)).status,
    ).toBe(404);
  });
});

describe("activities", () => {
  const walk = {
    activityType: "WALK",
    activityDate: "2026-11-10T14:30:00.000Z",
    durationMinutes: 45,
    distanceKm: 3.2,
    notes: "Park loop",
  };

  async function addActivity(
    agent: SuperAgentTest,
    petId: string,
    body: Record<string, unknown> = {},
  ) {
    const token = await csrf(agent);
    return agent
      .post(`/api/pets/${petId}/activities`)
      .set("x-csrf-token", token)
      .send({ ...walk, ...body });
  }

  async function changeActivity(
    agent: SuperAgentTest,
    petId: string,
    id: string,
    body: Record<string, unknown>,
  ) {
    const token = await csrf(agent);
    return agent
      .patch(`/api/pets/${petId}/activities/${id}`)
      .set("x-csrf-token", token)
      .send(body);
  }

  async function removeActivity(
    agent: SuperAgentTest,
    petId: string,
    id: string,
  ) {
    const token = await csrf(agent);
    return agent
      .delete(`/api/pets/${petId}/activities/${id}`)
      .set("x-csrf-token", token);
  }

  it("creates, lists newest first, updates, and deletes an activity", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;

    const older = await addActivity(agent, pet.id);
    expect(older.status).toBe(201);
    expect(older.body.data).toMatchObject({
      activityType: "WALK",
      durationMinutes: 45,
      distanceKm: 3.2,
    });
    const newer = await addActivity(agent, pet.id, {
      activityType: "PLAY",
      activityDate: "2026-11-11T09:00:00.000Z",
      distanceKm: null,
    });
    expect(newer.status).toBe(201);

    const list = await agent.get(`/api/pets/${pet.id}/activities`).expect(200);
    expect(list.body.data.map((item: { id: string }) => item.id)).toEqual([
      newer.body.data.id,
      older.body.data.id,
    ]);

    const updated = await changeActivity(agent, pet.id, older.body.data.id, {
      durationMinutes: 60,
      notes: "Longer walk",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      durationMinutes: 60,
      notes: "Longer walk",
      distanceKm: 3.2,
    });

    const removed = await removeActivity(agent, pet.id, older.body.data.id);
    expect(removed.status).toBe(204);
    const remaining = await agent
      .get(`/api/pets/${pet.id}/activities`)
      .expect(200);
    expect(remaining.body.data).toHaveLength(1);
  });

  it("rejects future dates and invalid numbers", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

    expect(
      (await addActivity(agent, pet.id, { activityDate: tomorrow })).status,
    ).toBe(400);
    expect(
      (await addActivity(agent, pet.id, { durationMinutes: 0 })).status,
    ).toBe(400);
    expect(
      (await addActivity(agent, pet.id, { durationMinutes: 12.5 })).status,
    ).toBe(400);
    expect((await addActivity(agent, pet.id, { distanceKm: -1 })).status).toBe(
      400,
    );
    expect(
      (await addActivity(agent, pet.id, { activityType: "FLYING" })).status,
    ).toBe(400);
    expect(
      (
        await addActivity(agent, pet.id, {
          durationMinutes: null,
          distanceKm: null,
          notes: null,
        })
      ).status,
    ).toBe(201);
  });

  it("rejects cross-user activity access", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = (await createPet(owner)).body.data;
    const created = await addActivity(owner, pet.id);
    expect(created.status).toBe(201);

    const other = request.agent(app);
    await register(other, "sam@example.com", "Sam Lee");
    await other.get(`/api/pets/${pet.id}/activities`).expect(404);
    expect((await addActivity(other, pet.id)).status).toBe(404);
    expect(
      (
        await changeActivity(other, pet.id, created.body.data.id, {
          durationMinutes: 5,
        })
      ).status,
    ).toBe(404);
    expect(
      (await removeActivity(other, pet.id, created.body.data.id)).status,
    ).toBe(404);
  });
});

describe("photos", () => {
  // Only the leading JPEG signature matters to the API.
  const jpeg = (size = 200) =>
    Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(size, 7),
    ]);
  const details = "width=800&height=600&caption=Sunny%20day";

  async function addPhoto(
    agent: SuperAgentTest,
    petId: string,
    options: { body?: Buffer; type?: string; query?: string } = {},
  ) {
    const token = await csrf(agent);
    return agent
      .post(`/api/pets/${petId}/photos?${options.query ?? details}`)
      .set("x-csrf-token", token)
      .set("Content-Type", options.type ?? "image/jpeg")
      .send(options.body ?? jpeg());
  }

  async function changePhoto(
    agent: SuperAgentTest,
    petId: string,
    id: string,
    body: Record<string, unknown>,
  ) {
    const token = await csrf(agent);
    return agent
      .patch(`/api/pets/${petId}/photos/${id}`)
      .set("x-csrf-token", token)
      .send(body);
  }

  async function removePhoto(agent: SuperAgentTest, petId: string, id: string) {
    const token = await csrf(agent);
    return agent
      .delete(`/api/pets/${petId}/photos/${id}`)
      .set("x-csrf-token", token);
  }

  it("uploads, lists, serves, captions, and deletes a photo", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;
    const original = jpeg(500);

    const created = await addPhoto(agent, pet.id, { body: original });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      caption: "Sunny day",
      width: 800,
      height: 600,
      sizeBytes: original.length,
    });
    expect(created.body.data.data).toBeUndefined();

    const list = await agent.get(`/api/pets/${pet.id}/photos`).expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].data).toBeUndefined();

    const file = await agent
      .get(`/api/pets/${pet.id}/photos/${created.body.data.id}/file`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(file.headers["content-type"]).toContain("image/jpeg");
    expect(Buffer.compare(file.body as Buffer, original)).toBe(0);

    const renamed = await changePhoto(agent, pet.id, created.body.data.id, {
      caption: "  New caption  ",
    });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.caption).toBe("New caption");
    const cleared = await changePhoto(agent, pet.id, created.body.data.id, {
      caption: null,
    });
    expect(cleared.body.data.caption).toBeNull();

    expect(
      (await removePhoto(agent, pet.id, created.body.data.id)).status,
    ).toBe(204);
    await agent
      .get(`/api/pets/${pet.id}/photos/${created.body.data.id}/file`)
      .expect(404);
  });

  it("rejects files that are not valid JPEG uploads", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = (await createPet(agent)).body.data;
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.alloc(100),
    ]);

    expect((await addPhoto(agent, pet.id, { body: png })).status).toBe(400);
    expect(
      (await addPhoto(agent, pet.id, { body: Buffer.alloc(0) })).status,
    ).toBe(400);
    expect(
      (await addPhoto(agent, pet.id, { type: "application/octet-stream" }))
        .status,
    ).toBe(400);
    expect(
      (await addPhoto(agent, pet.id, { query: "caption=No%20size" })).status,
    ).toBe(400);
    expect(
      (await addPhoto(agent, pet.id, { body: jpeg(1_700_000) })).status,
    ).toBe(413);
    expect(
      (await agent.get(`/api/pets/${pet.id}/photos`).expect(200)).body.data,
    ).toHaveLength(0);
  });

  it("rejects cross-user photo access", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = (await createPet(owner)).body.data;
    const created = await addPhoto(owner, pet.id);
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    const other = request.agent(app);
    await register(other, "sam@example.com", "Sam Lee");
    await other.get(`/api/pets/${pet.id}/photos`).expect(404);
    await other.get(`/api/pets/${pet.id}/photos/${id}/file`).expect(404);
    expect((await addPhoto(other, pet.id)).status).toBe(404);
    expect(
      (await changePhoto(other, pet.id, id, { caption: "x" })).status,
    ).toBe(404);
    expect((await removePhoto(other, pet.id, id)).status).toBe(404);
  });
});

describe("appointments", () => {
  it("creates, updates, lists, retrieves, and cancels an appointment", async () => {
    const agent = request.agent(app);
    await register(agent);
    const pet = await createPet(agent);
    let token = await csrf(agent);
    const date = new Date(Date.now() + 86_400_000).toISOString();
    const created = await agent
      .post("/api/appointments")
      .set("x-csrf-token", token)
      .send({
        petId: pet.body.data.id,
        appointmentDate: date,
        providerName: "HappyPaws Clinic",
        reason: "Annual exam",
        notes: "Bring records",
      })
      .expect(201);
    const id = created.body.data.id;
    expect(
      (await agent.get("/api/appointments").expect(200)).body.data,
    ).toHaveLength(1);
    await agent.get(`/api/appointments/${id}`).expect(200);

    token = await csrf(agent);
    await agent
      .patch(`/api/appointments/${id}`)
      .set("x-csrf-token", token)
      .send({ reason: "Annual wellness exam" })
      .expect(200);
    token = await csrf(agent);
    const cancelled = await agent
      .delete(`/api/appointments/${id}`)
      .set("x-csrf-token", token)
      .expect(200);
    expect(cancelled.body.data.status).toBe("CANCELLED");
    expect(await prisma.appointment.count()).toBe(1);
  });

  it("rejects past dates and cross-user access", async () => {
    const owner = request.agent(app);
    await register(owner);
    const pet = await createPet(owner);
    let token = await csrf(owner);
    await owner
      .post("/api/appointments")
      .set("x-csrf-token", token)
      .send({
        petId: pet.body.data.id,
        appointmentDate: "2020-01-01T10:00:00.000Z",
        providerName: "Clinic",
        reason: "Invalid",
      })
      .expect(400);

    token = await csrf(owner);
    const valid = await owner
      .post("/api/appointments")
      .set("x-csrf-token", token)
      .send({
        petId: pet.body.data.id,
        appointmentDate: new Date(Date.now() + 86_400_000).toISOString(),
        providerName: "Clinic",
        reason: "Exam",
      })
      .expect(201);

    const outsider = request.agent(app);
    await register(outsider, "jamie@example.com");
    await outsider.get(`/api/appointments/${valid.body.data.id}`).expect(404);
  });
});

describe("dashboard", () => {
  it("returns database-backed owner-scoped summary data", async () => {
    const agent = request.agent(app);
    await register(agent);
    await createPet(agent, "Milo");
    const response = await agent.get("/api/dashboard").expect(200);
    expect(response.body.data.petCount).toBe(1);
    expect(response.body.data.pets[0].name).toBe("Milo");
    expect(response.body.data.upcomingAppointments).toEqual([]);
  });
});

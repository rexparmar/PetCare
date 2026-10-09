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

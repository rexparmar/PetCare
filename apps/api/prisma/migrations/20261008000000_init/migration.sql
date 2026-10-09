CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE "HealthRecordType" AS ENUM ('VACCINATION', 'MEDICAL_CHECKUP', 'TREATMENT', 'SURGERY', 'OTHER');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "fullName" VARCHAR(120) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "userId" UUID NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pet" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "species" VARCHAR(80) NOT NULL,
  "breed" VARCHAR(120),
  "dateOfBirth" DATE,
  "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
  "weight" DOUBLE PRECISION,
  "medicalNotes" TEXT,
  "ownerId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthRecord" (
  "id" UUID NOT NULL,
  "petId" UUID NOT NULL,
  "recordType" "HealthRecordType" NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT,
  "recordDate" DATE NOT NULL,
  "veterinarianName" VARCHAR(150),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" UUID NOT NULL,
  "petId" UUID NOT NULL,
  "appointmentDate" TIMESTAMP(3) NOT NULL,
  "providerName" VARCHAR(150) NOT NULL,
  "reason" VARCHAR(200) NOT NULL,
  "notes" TEXT,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");
CREATE INDEX "Pet_ownerId_name_idx" ON "Pet"("ownerId", "name");
CREATE INDEX "HealthRecord_petId_recordDate_idx" ON "HealthRecord"("petId", "recordDate");
CREATE INDEX "Appointment_petId_idx" ON "Appointment"("petId");
CREATE INDEX "Appointment_appointmentDate_status_idx" ON "Appointment"("appointmentDate", "status");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'AS_NEEDED');

-- CreateTable
CREATE TABLE "Medication" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "dosage" VARCHAR(80) NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "timesOfDay" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medication_petId_isActive_idx" ON "Medication"("petId", "isActive");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

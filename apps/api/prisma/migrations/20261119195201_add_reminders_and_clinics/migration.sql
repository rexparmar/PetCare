-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEDICATION', 'APPOINTMENT', 'CLINIC');

-- CreateEnum
CREATE TYPE "ClinicRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" UUID NOT NULL,
    "timeZone" VARCHAR(64) NOT NULL,
    "medicationReminders" BOOLEAN NOT NULL DEFAULT true,
    "appointmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "appointmentLeadHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "petId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "dedupeKey" VARCHAR(200) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLink" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "clinicId" VARCHAR(50) NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSharedAt" TIMESTAMP(3),
    "lastSharedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClinicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicAppointmentRequest" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clinicId" VARCHAR(50) NOT NULL,
    "externalReference" VARCHAR(80) NOT NULL,
    "status" "ClinicRequestStatus" NOT NULL,
    "message" VARCHAR(300),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicAppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_dueAt_idx" ON "Notification"("userId", "readAt", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLink_petId_key" ON "ClinicLink"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicAppointmentRequest_appointmentId_key" ON "ClinicAppointmentRequest"("appointmentId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicLink" ADD CONSTRAINT "ClinicLink_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentRequest" ADD CONSTRAINT "ClinicAppointmentRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

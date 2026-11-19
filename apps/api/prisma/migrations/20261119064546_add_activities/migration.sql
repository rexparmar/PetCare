-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WALK', 'PLAY', 'FEEDING', 'GROOMING', 'TRAINING', 'OTHER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_petId_activityDate_idx" ON "Activity"("petId", "activityDate");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

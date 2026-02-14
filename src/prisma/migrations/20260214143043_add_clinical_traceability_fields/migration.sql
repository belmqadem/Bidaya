-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "birthLength" DOUBLE PRECISION,
ADD COLUMN     "headCircumferenceAtBirth" DOUBLE PRECISION,
ADD COLUMN     "placeOfBirth" TEXT;

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "treatmentPrescribed" TEXT;

-- AlterTable
ALTER TABLE "Vaccination" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "injectionSite" TEXT,
ADD COLUMN     "notes" TEXT;

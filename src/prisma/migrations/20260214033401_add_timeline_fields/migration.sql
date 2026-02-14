-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "birthWeight" DOUBLE PRECISION,
ADD COLUMN     "deliveryType" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'unknown';

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "diagnosis" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reasonForVisit" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Vaccination" ADD COLUMN     "healthcareProfessionalName" TEXT,
ADD COLUMN     "nextDoseDate" TIMESTAMP(3);

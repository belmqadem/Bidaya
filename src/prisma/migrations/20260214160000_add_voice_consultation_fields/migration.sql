-- AlterTable: add voice consultation fields
ALTER TABLE "Consultation" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Consultation" ADD COLUMN "transcript" TEXT;

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'unknown',
    "birthWeight" DOUBLE PRECISION,
    "birthLength" DOUBLE PRECISION,
    "headCircumferenceAtBirth" DOUBLE PRECISION,
    "placeOfBirth" TEXT,
    "deliveryType" TEXT NOT NULL DEFAULT 'normal',
    "parentName" TEXT NOT NULL,
    "parentContact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clinicName" TEXT NOT NULL,
    "nextDoseDate" TIMESTAMP(3),
    "healthcareProfessionalName" TEXT,
    "batchNumber" TEXT,
    "injectionSite" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "clinicianName" TEXT NOT NULL,
    "reasonForVisit" TEXT NOT NULL DEFAULT '',
    "diagnosis" TEXT NOT NULL DEFAULT '',
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "treatmentPrescribed" TEXT,
    "followUpDate" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "transcript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SideEffectReport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "vaccinationId" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'mild',
    "status" TEXT NOT NULL DEFAULT 'open',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SideEffectReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportMessage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reportId" TEXT,
    "childId" TEXT NOT NULL,
    "doctorName" TEXT NOT NULL,
    "medications" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "dispensedAt" TIMESTAMP(3),
    "dispensedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Child_identifier_key" ON "Child"("identifier");

-- CreateIndex
CREATE INDEX "Vaccination_childId_idx" ON "Vaccination"("childId");

-- CreateIndex
CREATE INDEX "Consultation_childId_idx" ON "Consultation"("childId");

-- CreateIndex
CREATE INDEX "SideEffectReport_childId_idx" ON "SideEffectReport"("childId");

-- CreateIndex
CREATE INDEX "ReportMessage_reportId_idx" ON "ReportMessage"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_code_key" ON "Prescription"("code");

-- CreateIndex
CREATE INDEX "Prescription_childId_idx" ON "Prescription"("childId");

-- CreateIndex
CREATE INDEX "Prescription_code_idx" ON "Prescription"("code");

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideEffectReport" ADD CONSTRAINT "SideEffectReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SideEffectReport" ADD CONSTRAINT "SideEffectReport_vaccinationId_fkey" FOREIGN KEY ("vaccinationId") REFERENCES "Vaccination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMessage" ADD CONSTRAINT "ReportMessage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SideEffectReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SideEffectReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

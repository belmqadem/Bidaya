"use server";

import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChildProfile = {
  identifier: string;
  fullName: string;
  birthDate: string;
  gender: string;
  birthWeight: number | null;
  birthLength: number | null;
  headCircumferenceAtBirth: number | null;
  placeOfBirth: string | null;
  deliveryType: string;
  parentName: string;
  parentContact: string;
  createdAt: string;
};

export type VaccinationEntry = {
  id: string;
  vaccine: string;
  dose: number;
  date: string;
  clinicName: string;
  nextDoseDate: string | null;
  healthcareProfessionalName: string | null;
  batchNumber: string | null;
  injectionSite: string | null;
  notes: string | null;
};

export type ConsultationEntry = {
  id: string;
  date: string;
  summary: string;
  clinicianName: string;
  reasonForVisit: string;
  diagnosis: string;
  followUpRequired: boolean;
  treatmentPrescribed: string | null;
  followUpDate: string | null;
};

type MyChildResult =
  | {
      found: true;
      child: ChildProfile;
      vaccinations: VaccinationEntry[];
      consultations: ConsultationEntry[];
    }
  | { found: false; error: string };

// ── Get my child (from session) ──────────────────────────────────────────────

export async function getMyChild(): Promise<MyChildResult> {
  const session = await requireParent();
  const identifier = session.childIdentifier;

  try {
    const child = await prisma.child.findUnique({
      where: { identifier },
      include: {
        vaccinations: { orderBy: { date: "desc" } },
        consultations: { orderBy: { date: "desc" } },
      },
    });

    if (!child) {
      return { found: false, error: "Dossier enfant introuvable." };
    }

    return {
      found: true,
      child: {
        identifier: child.identifier,
        fullName: child.fullName,
        birthDate: child.birthDate.toISOString().split("T")[0],
        gender: child.gender,
        birthWeight: child.birthWeight,
        birthLength: child.birthLength,
        headCircumferenceAtBirth: child.headCircumferenceAtBirth,
        placeOfBirth: child.placeOfBirth,
        deliveryType: child.deliveryType,
        parentName: child.parentName,
        parentContact: child.parentContact,
        createdAt: child.createdAt.toISOString().split("T")[0],
      },
      vaccinations: child.vaccinations.map((v) => ({
        id: v.id,
        vaccine: v.vaccine,
        dose: v.dose,
        date: v.date.toISOString().split("T")[0],
        clinicName: v.clinicName,
        nextDoseDate: v.nextDoseDate?.toISOString().split("T")[0] ?? null,
        healthcareProfessionalName: v.healthcareProfessionalName,
        batchNumber: v.batchNumber,
        injectionSite: v.injectionSite,
        notes: v.notes,
      })),
      consultations: child.consultations.map((c) => ({
        id: c.id,
        date: c.date.toISOString().split("T")[0],
        summary: c.summary,
        clinicianName: c.clinicianName,
        reasonForVisit: c.reasonForVisit,
        diagnosis: c.diagnosis,
        followUpRequired: c.followUpRequired,
        treatmentPrescribed: c.treatmentPrescribed,
        followUpDate: c.followUpDate?.toISOString().split("T")[0] ?? null,
      })),
    };
  } catch {
    return { found: false, error: "Échec du chargement du dossier. Veuillez réessayer." };
  }
}

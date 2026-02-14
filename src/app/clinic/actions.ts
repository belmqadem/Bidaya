"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  addVaccinationSchema,
  type AddVaccinationInput,
} from "@/lib/schemas/vaccination";
import {
  addConsultationSchema,
  type AddConsultationInput,
} from "@/lib/schemas/consultation";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChildRecord = {
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

export type VaccinationRecord = {
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

export type ConsultationRecord = {
  id: string;
  date: string;
  summary: string;
  clinicianName: string;
  reasonForVisit: string;
  diagnosis: string;
  followUpRequired: boolean;
  treatmentPrescribed: string | null;
  followUpDate: string | null;
  source: string;
};

type SearchResult =
  | { found: true; child: ChildRecord; vaccinations: VaccinationRecord[]; consultations: ConsultationRecord[] }
  | { found: false; error: string };

type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ── Search child ─────────────────────────────────────────────────────────────

export async function searchChild(identifier: string): Promise<SearchResult> {
  await requireRole("clinic");

  const trimmed = identifier.trim().toUpperCase();
  if (!trimmed) {
    return { found: false, error: "Veuillez entrer un identifiant." };
  }

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: trimmed },
      include: {
        vaccinations: { orderBy: { date: "desc" } },
        consultations: { orderBy: { date: "desc" } },
      },
    });

    if (!child) {
      return { found: false, error: "Aucun enfant trouvé avec cet identifiant." };
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
        source: c.source,
      })),
    };
  } catch {
    return { found: false, error: "La recherche a échoué. Veuillez réessayer." };
  }
}

// ── Add vaccination ──────────────────────────────────────────────────────────

export async function addVaccination(
  input: AddVaccinationInput,
): Promise<ActionResult> {
  await requireRole("clinic");

  const parsed = addVaccinationSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return { success: false, error: msg };
  }

  const { childIdentifier, vaccine, dose, date, clinicName, nextDoseDate, healthcareProfessionalName, batchNumber, injectionSite, notes } = parsed.data;

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
    });

    if (!child) {
      return { success: false, error: "Enfant introuvable." };
    }

    await prisma.vaccination.create({
      data: {
        childId: child.id,
        vaccine,
        dose,
        date: new Date(date),
        clinicName,
        nextDoseDate: nextDoseDate ? new Date(nextDoseDate) : null,
        healthcareProfessionalName: healthcareProfessionalName || null,
        batchNumber: batchNumber || null,
        injectionSite: injectionSite || null,
        notes: notes || null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Échec de l'enregistrement de la vaccination. Veuillez réessayer." };
  }
}

// ── Get vaccinations (for refresh) ───────────────────────────────────────────

export async function getVaccinations(
  childIdentifier: string,
): Promise<VaccinationRecord[]> {
  await requireRole("clinic");

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
      include: { vaccinations: { orderBy: { date: "desc" } } },
    });

    if (!child) return [];

    return child.vaccinations.map((v) => ({
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
    }));
  } catch {
    return [];
  }
}

// ── Add consultation ─────────────────────────────────────────────────────────

export async function addConsultation(
  input: AddConsultationInput,
): Promise<ActionResult> {
  await requireRole("clinic");

  const parsed = addConsultationSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return { success: false, error: msg };
  }

  const { childIdentifier, date, summary, clinicianName, reasonForVisit, diagnosis, followUpRequired, treatmentPrescribed, followUpDate, source, transcript } = parsed.data;

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
    });

    if (!child) {
      return { success: false, error: "Enfant introuvable." };
    }

    await prisma.consultation.create({
      data: {
        childId: child.id,
        date: new Date(date),
        summary,
        clinicianName,
        reasonForVisit: reasonForVisit || "",
        diagnosis: diagnosis || "",
        followUpRequired: followUpRequired ?? false,
        treatmentPrescribed: treatmentPrescribed || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        source: source || "manual",
        transcript: transcript || null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Échec de l'enregistrement de la consultation. Veuillez réessayer." };
  }
}

// ── Get consultations (for refresh) ──────────────────────────────────────────

export async function getConsultations(
  childIdentifier: string,
): Promise<ConsultationRecord[]> {
  await requireRole("clinic");

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
      include: { consultations: { orderBy: { date: "desc" } } },
    });

    if (!child) return [];

    return child.consultations.map((c) => ({
      id: c.id,
      date: c.date.toISOString().split("T")[0],
      summary: c.summary,
      clinicianName: c.clinicianName,
      reasonForVisit: c.reasonForVisit,
      diagnosis: c.diagnosis,
      followUpRequired: c.followUpRequired,
      treatmentPrescribed: c.treatmentPrescribed,
      followUpDate: c.followUpDate?.toISOString().split("T")[0] ?? null,
      source: c.source,
    }));
  } catch {
    return [];
  }
}

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
};

export type ConsultationRecord = {
  id: string;
  date: string;
  summary: string;
  clinicianName: string;
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
    return { found: false, error: "Please enter an identifier." };
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
      return { found: false, error: "No child found with this identifier." };
    }

    return {
      found: true,
      child: {
        identifier: child.identifier,
        fullName: child.fullName,
        birthDate: child.birthDate.toISOString().split("T")[0],
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
      })),
      consultations: child.consultations.map((c) => ({
        id: c.id,
        date: c.date.toISOString().split("T")[0],
        summary: c.summary,
        clinicianName: c.clinicianName,
      })),
    };
  } catch {
    return { found: false, error: "Search failed. Please try again." };
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

  const { childIdentifier, vaccine, dose, date, clinicName } = parsed.data;

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
    });

    if (!child) {
      return { success: false, error: "Child not found." };
    }

    await prisma.vaccination.create({
      data: {
        childId: child.id,
        vaccine,
        dose,
        date: new Date(date),
        clinicName,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save vaccination. Please try again." };
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

  const { childIdentifier, date, summary, clinicianName } = parsed.data;

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: childIdentifier.trim().toUpperCase() },
    });

    if (!child) {
      return { success: false, error: "Child not found." };
    }

    await prisma.consultation.create({
      data: {
        childId: child.id,
        date: new Date(date),
        summary,
        clinicianName,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to save consultation. Please try again." };
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
    }));
  } catch {
    return [];
  }
}

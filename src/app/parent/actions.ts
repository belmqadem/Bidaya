"use server";

import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChildProfile = {
  identifier: string;
  fullName: string;
  birthDate: string;
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
};

export type ConsultationEntry = {
  id: string;
  date: string;
  summary: string;
  clinicianName: string;
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

/**
 * Fetch the child record linked to the current parent session.
 * The childIdentifier is stored in the session cookie — no user input needed.
 */
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
      return { found: false, error: "Child record not found." };
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
    return { found: false, error: "Failed to load child record. Please try again." };
  }
}

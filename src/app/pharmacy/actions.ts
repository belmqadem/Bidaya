"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

export type PrescriptionDetail = {
  code: string;
  childName: string;
  childIdentifier: string;
  doctorName: string;
  medications: string;
  instructions: string;
  notes: string | null;
  status: string;
  dispensedBy: string | null;
  dispensedAt: string | null;
  createdAt: string;
};

type LookupResult =
  | { found: true; prescription: PrescriptionDetail }
  | { found: false; error: string };

type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ── Lookup prescription by code ──────────────────────────────────────────────

export async function lookupPrescription(code: string): Promise<LookupResult> {
  await requireRole("pharmacy");

  const cleaned = code?.trim().toUpperCase();
  if (!cleaned) {
    return { found: false, error: "Veuillez entrer un code d'ordonnance." };
  }

  try {
    const rx = await prisma.prescription.findUnique({
      where: { code: cleaned },
      include: {
        child: { select: { fullName: true, identifier: true } },
      },
    });

    if (!rx) {
      return { found: false, error: "Aucune ordonnance trouvée avec ce code." };
    }

    return {
      found: true,
      prescription: {
        code: rx.code,
        childName: rx.child.fullName,
        childIdentifier: rx.child.identifier,
        doctorName: rx.doctorName,
        medications: rx.medications,
        instructions: rx.instructions,
        notes: rx.notes,
        status: rx.status,
        dispensedBy: rx.dispensedBy,
        dispensedAt: rx.dispensedAt?.toISOString().split("T")[0] ?? null,
        createdAt: rx.createdAt.toISOString().split("T")[0],
      },
    };
  } catch {
    return { found: false, error: "Erreur lors de la recherche." };
  }
}

// ── Mark as dispensed ────────────────────────────────────────────────────────

export async function markDispensed(
  code: string,
  pharmacyName: string,
): Promise<ActionResult> {
  await requireRole("pharmacy");

  if (!pharmacyName?.trim()) {
    return { success: false, error: "Le nom de la pharmacie est requis." };
  }

  try {
    const rx = await prisma.prescription.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!rx) {
      return { success: false, error: "Ordonnance introuvable." };
    }

    if (rx.status === "dispensed") {
      return {
        success: false,
        error: "Cette ordonnance a déjà été dispensée.",
      };
    }

    await prisma.prescription.update({
      where: { code: rx.code },
      data: {
        status: "dispensed",
        dispensedAt: new Date(),
        dispensedBy: pharmacyName.trim(),
      },
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Échec de la mise à jour de l'ordonnance.",
    };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { randomBytes } from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReportListItem = {
  id: string;
  childName: string;
  childIdentifier: string;
  vaccineName: string | null;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  messageCount: number;
};

export type ClinicReportDetail = {
  id: string;
  childName: string;
  childIdentifier: string;
  description: string;
  severity: string;
  status: string;
  imageUrl: string | null;
  vaccineName: string | null;
  vaccineDate: string | null;
  createdAt: string;
  messages: {
    id: string;
    senderRole: string;
    content: string;
    createdAt: string;
  }[];
  prescription: {
    code: string;
    doctorName: string;
    medications: string;
    instructions: string;
    notes: string | null;
    status: string;
    dispensedBy: string | null;
    dispensedAt: string | null;
    createdAt: string;
  } | null;
};

type ActionResult =
  | { success: true }
  | { success: false; error: string };

type PrescriptionResult =
  | { success: true; code: string }
  | { success: false; error: string };

// ── Generate prescription code ───────────────────────────────────────────────

function generatePrescriptionCode(): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `ORD-${code.slice(0, 4)}-${code.slice(4)}`;
}

// ── Get all reports (clinic) ─────────────────────────────────────────────────

export async function getOpenReports(): Promise<ReportListItem[]> {
  await requireRole("clinic");

  try {
    const reports = await prisma.sideEffectReport.findMany({
      include: {
        child: { select: { fullName: true, identifier: true } },
        vaccination: { select: { vaccine: true } },
        messages: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reports.map((r) => ({
      id: r.id,
      childName: r.child.fullName,
      childIdentifier: r.child.identifier,
      vaccineName: r.vaccination?.vaccine ?? null,
      description: r.description,
      severity: r.severity,
      status: r.status,
      createdAt: r.createdAt.toISOString().split("T")[0],
      messageCount: r.messages.length,
    }));
  } catch {
    return [];
  }
}

// ── Get single report (clinic) ───────────────────────────────────────────────

export async function getClinicReport(
  reportId: string,
): Promise<ClinicReportDetail | null> {
  await requireRole("clinic");

  try {
    const report = await prisma.sideEffectReport.findUnique({
      where: { id: reportId },
      include: {
        child: { select: { fullName: true, identifier: true } },
        vaccination: { select: { vaccine: true, date: true } },
        messages: { orderBy: { createdAt: "asc" } },
        prescriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!report) return null;

    const rx = report.prescriptions[0] ?? null;

    return {
      id: report.id,
      childName: report.child.fullName,
      childIdentifier: report.child.identifier,
      description: report.description,
      severity: report.severity,
      status: report.status,
      imageUrl: report.imageUrl,
      vaccineName: report.vaccination?.vaccine ?? null,
      vaccineDate:
        report.vaccination?.date.toISOString().split("T")[0] ?? null,
      createdAt: report.createdAt.toISOString().split("T")[0],
      messages: report.messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      prescription: rx
        ? {
            code: rx.code,
            doctorName: rx.doctorName,
            medications: rx.medications,
            instructions: rx.instructions,
            notes: rx.notes,
            status: rx.status,
            dispensedBy: rx.dispensedBy,
            dispensedAt: rx.dispensedAt?.toISOString().split("T")[0] ?? null,
            createdAt: rx.createdAt.toISOString().split("T")[0],
          }
        : null,
    };
  } catch {
    return null;
  }
}

// ── Add message (clinic) ─────────────────────────────────────────────────────

export async function addClinicMessage(
  reportId: string,
  content: string,
): Promise<ActionResult> {
  await requireRole("clinic");

  if (!content?.trim()) {
    return { success: false, error: "Le message ne peut pas être vide." };
  }

  try {
    await prisma.reportMessage.create({
      data: {
        reportId,
        senderRole: "clinic",
        content: content.trim(),
      },
    });

    // Update status to replied if still open
    await prisma.sideEffectReport.update({
      where: { id: reportId },
      data: {
        status: "replied",
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Échec de l'envoi du message." };
  }
}

// ── Create prescription ──────────────────────────────────────────────────────

export async function createPrescription(input: {
  reportId: string;
  doctorName: string;
  medications: string;
  instructions: string;
  notes?: string;
}): Promise<PrescriptionResult> {
  await requireRole("clinic");

  const { reportId, doctorName, medications, instructions, notes } = input;

  if (!doctorName?.trim() || !medications?.trim() || !instructions?.trim()) {
    return {
      success: false,
      error: "Tous les champs obligatoires doivent être remplis.",
    };
  }

  try {
    const report = await prisma.sideEffectReport.findUnique({
      where: { id: reportId },
      select: { childId: true },
    });

    if (!report) {
      return { success: false, error: "Signalement introuvable." };
    }

    // Generate unique code
    let code = generatePrescriptionCode();
    let retries = 5;
    while (retries > 0) {
      const exists = await prisma.prescription.findUnique({
        where: { code },
      });
      if (!exists) break;
      code = generatePrescriptionCode();
      retries--;
    }

    await prisma.prescription.create({
      data: {
        code,
        reportId,
        childId: report.childId,
        doctorName: doctorName.trim(),
        medications: medications.trim(),
        instructions: instructions.trim(),
        notes: notes?.trim() || null,
      },
    });

    // Update report status
    await prisma.sideEffectReport.update({
      where: { id: reportId },
      data: { status: "prescribed" },
    });

    return { success: true, code };
  } catch {
    return { success: false, error: "Échec de la création de l'ordonnance." };
  }
}

// ── Close report ─────────────────────────────────────────────────────────────

export async function closeReport(reportId: string): Promise<ActionResult> {
  await requireRole("clinic");

  try {
    await prisma.sideEffectReport.update({
      where: { id: reportId },
      data: { status: "closed" },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Échec de la fermeture du signalement." };
  }
}

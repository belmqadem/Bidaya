"use server";

import { prisma } from "@/lib/prisma";
import { requireParent } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

export type ReportSummary = {
  id: string;
  vaccineName: string | null;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
  messageCount: number;
  hasPrescription: boolean;
};

export type ReportDetail = {
  id: string;
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
    createdAt: string;
  } | null;
};

export type VaccinationOption = {
  id: string;
  label: string;
};

type ActionResult =
  | { success: true; reportId?: string }
  | { success: false; error: string };

// ── Get vaccinations for select ──────────────────────────────────────────────

export async function getMyVaccinations(): Promise<VaccinationOption[]> {
  const session = await requireParent();

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: session.childIdentifier },
      include: {
        vaccinations: { orderBy: { date: "desc" }, take: 20 },
      },
    });

    if (!child) return [];

    return child.vaccinations.map((v) => ({
      id: v.id,
      label: `${v.vaccine} — Dose ${v.dose} (${v.date.toISOString().split("T")[0]})`,
    }));
  } catch {
    return [];
  }
}

// ── Create report ────────────────────────────────────────────────────────────

export async function createReport(input: {
  vaccinationId?: string;
  description: string;
  severity: string;
  imageUrl?: string;
}): Promise<ActionResult> {
  const session = await requireParent();

  const { description, severity, vaccinationId, imageUrl } = input;
  if (!description?.trim()) {
    return { success: false, error: "Veuillez décrire les symptômes." };
  }

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: session.childIdentifier },
    });
    if (!child) return { success: false, error: "Enfant introuvable." };

    const report = await prisma.sideEffectReport.create({
      data: {
        childId: child.id,
        vaccinationId: vaccinationId || null,
        description: description.trim(),
        severity: severity || "mild",
        imageUrl: imageUrl || null,
      },
    });

    return { success: true, reportId: report.id };
  } catch {
    return { success: false, error: "Échec de l'envoi du signalement." };
  }
}

// ── Get my reports ───────────────────────────────────────────────────────────

export async function getMyReports(): Promise<ReportSummary[]> {
  const session = await requireParent();

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: session.childIdentifier },
    });
    if (!child) return [];

    const reports = await prisma.sideEffectReport.findMany({
      where: { childId: child.id },
      include: {
        vaccination: { select: { vaccine: true } },
        messages: { select: { id: true } },
        prescriptions: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reports.map((r) => ({
      id: r.id,
      vaccineName: r.vaccination?.vaccine ?? null,
      description: r.description,
      severity: r.severity,
      status: r.status,
      createdAt: r.createdAt.toISOString().split("T")[0],
      messageCount: r.messages.length,
      hasPrescription: r.prescriptions.length > 0,
    }));
  } catch {
    return [];
  }
}

// ── Get single report detail ─────────────────────────────────────────────────

export async function getReport(reportId: string): Promise<ReportDetail | null> {
  const session = await requireParent();

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: session.childIdentifier },
    });
    if (!child) return null;

    const report = await prisma.sideEffectReport.findFirst({
      where: { id: reportId, childId: child.id },
      include: {
        vaccination: { select: { vaccine: true, date: true } },
        messages: { orderBy: { createdAt: "asc" } },
        prescriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!report) return null;

    const rx = report.prescriptions[0] ?? null;

    return {
      id: report.id,
      description: report.description,
      severity: report.severity,
      status: report.status,
      imageUrl: report.imageUrl,
      vaccineName: report.vaccination?.vaccine ?? null,
      vaccineDate: report.vaccination?.date.toISOString().split("T")[0] ?? null,
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
            createdAt: rx.createdAt.toISOString().split("T")[0],
          }
        : null,
    };
  } catch {
    return null;
  }
}

// ── Add message (parent) ─────────────────────────────────────────────────────

export async function addParentMessage(
  reportId: string,
  content: string,
): Promise<ActionResult> {
  const session = await requireParent();

  if (!content?.trim()) {
    return { success: false, error: "Le message ne peut pas être vide." };
  }

  try {
    const child = await prisma.child.findUnique({
      where: { identifier: session.childIdentifier },
    });
    if (!child) return { success: false, error: "Enfant introuvable." };

    // Verify report belongs to this child
    const report = await prisma.sideEffectReport.findFirst({
      where: { id: reportId, childId: child.id },
    });
    if (!report) return { success: false, error: "Signalement introuvable." };

    await prisma.reportMessage.create({
      data: {
        reportId,
        senderRole: "parent",
        content: content.trim(),
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Échec de l'envoi du message." };
  }
}

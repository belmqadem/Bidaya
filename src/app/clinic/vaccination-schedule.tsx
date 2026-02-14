"use client";

import { useState, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Syringe,
  Check,
  Clock,
  AlertTriangle,
  X,
  CalendarPlus,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addVaccination, getVaccinations } from "./actions";
import type { AddVaccinationInput } from "@/lib/schemas/vaccination";

// ── Types locaux (compatible avec VaccinationRecord et VaccinationEntry) ─────

export type VaccinationScheduleRecord = {
  id: string;
  vaccine: string;
  dose: number;
  date: string;
  clinicName: string;
  nextDoseDate?: string | null;
  healthcareProfessionalName?: string | null;
  batchNumber?: string | null;
  injectionSite?: string | null;
  notes?: string | null;
};

// ── Programme National d'Immunisation du Maroc ───────────────────────────────

type ScheduleVaccine = {
  vaccine: string;
  dose: number;
  label: string;
};

type AgeMilestone = {
  ageLabel: string;
  ageMonths: number; // 0 = naissance
  vaccines: ScheduleVaccine[];
};

const MOROCCO_SCHEDULE: AgeMilestone[] = [
  {
    ageLabel: "Naissance",
    ageMonths: 0,
    vaccines: [
      { vaccine: "BCG", dose: 1, label: "BCG" },
      { vaccine: "VHB", dose: 1, label: "Hépatite B (1re dose)" },
      { vaccine: "VPO", dose: 0, label: "Polio oral (dose 0)" },
    ],
  },
  {
    ageLabel: "2 mois",
    ageMonths: 2,
    vaccines: [
      { vaccine: "DTC", dose: 1, label: "DTC (1re dose)" },
      { vaccine: "VPO", dose: 1, label: "Polio oral (1re dose)" },
      { vaccine: "Hib", dose: 1, label: "Haemophilus b (1re dose)" },
      { vaccine: "VHB", dose: 2, label: "Hépatite B (2e dose)" },
      { vaccine: "Pneumo", dose: 1, label: "Pneumocoque (1re dose)" },
      { vaccine: "Rota", dose: 1, label: "Rotavirus (1re dose)" },
    ],
  },
  {
    ageLabel: "3 mois",
    ageMonths: 3,
    vaccines: [
      { vaccine: "DTC", dose: 2, label: "DTC (2e dose)" },
      { vaccine: "VPO", dose: 2, label: "Polio oral (2e dose)" },
      { vaccine: "Hib", dose: 2, label: "Haemophilus b (2e dose)" },
      { vaccine: "Pneumo", dose: 2, label: "Pneumocoque (2e dose)" },
      { vaccine: "Rota", dose: 2, label: "Rotavirus (2e dose)" },
    ],
  },
  {
    ageLabel: "4 mois",
    ageMonths: 4,
    vaccines: [
      { vaccine: "DTC", dose: 3, label: "DTC (3e dose)" },
      { vaccine: "VPO", dose: 3, label: "Polio oral (3e dose)" },
      { vaccine: "Hib", dose: 3, label: "Haemophilus b (3e dose)" },
      { vaccine: "VHB", dose: 3, label: "Hépatite B (3e dose)" },
      { vaccine: "Pneumo", dose: 3, label: "Pneumocoque (3e dose)" },
    ],
  },
  {
    ageLabel: "9 mois",
    ageMonths: 9,
    vaccines: [
      { vaccine: "RR", dose: 1, label: "Rougeole-Rubéole (1re dose)" },
    ],
  },
  {
    ageLabel: "12 mois",
    ageMonths: 12,
    vaccines: [
      { vaccine: "RR", dose: 2, label: "Rougeole-Rubéole (2e dose)" },
    ],
  },
  {
    ageLabel: "18 mois",
    ageMonths: 18,
    vaccines: [
      { vaccine: "DTC", dose: 4, label: "DTC (1er rappel)" },
      { vaccine: "VPO", dose: 4, label: "Polio oral (1er rappel)" },
    ],
  },
  {
    ageLabel: "5 ans",
    ageMonths: 60,
    vaccines: [
      { vaccine: "DTC", dose: 5, label: "DTC (2e rappel)" },
      { vaccine: "VPO", dose: 5, label: "Polio oral (2e rappel)" },
    ],
  },
];

// ── Types ────────────────────────────────────────────────────────────────────

type VaccineStatus = "completed" | "overdue" | "pending";

type ComputedRow = {
  vaccine: string;
  dose: number;
  label: string;
  status: VaccineStatus;
  record: VaccinationScheduleRecord | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChildAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function computeStatus(
  sv: ScheduleVaccine,
  milestoneAgeMonths: number,
  childAgeMonths: number,
  vaccinations: VaccinationScheduleRecord[],
): { status: VaccineStatus; record: VaccinationScheduleRecord | null } {
  const match = vaccinations.find(
    (v) => v.vaccine.toLowerCase() === sv.vaccine.toLowerCase() && v.dose === sv.dose,
  );
  if (match) return { status: "completed", record: match };
  if (childAgeMonths > milestoneAgeMonths + 1) return { status: "overdue", record: null };
  return { status: "pending", record: null };
}

function statusLabel(s: VaccineStatus) {
  switch (s) {
    case "completed": return "Effectué";
    case "overdue": return "En retard";
    case "pending": return "En attente";
  }
}

function statusBadgeVariant(s: VaccineStatus) {
  switch (s) {
    case "completed": return "default" as const;
    case "overdue": return "destructive" as const;
    case "pending": return "secondary" as const;
  }
}

// ── Composant principal ──────────────────────────────────────────────────────

export function VaccinationSchedule({
  childIdentifier,
  birthDate,
  vaccinations,
  onVaccinationAdded,
  readOnly = false,
}: {
  childIdentifier: string;
  birthDate: string;
  vaccinations: VaccinationScheduleRecord[];
  onVaccinationAdded?: () => void;
  readOnly?: boolean;
}) {
  const childAgeMonths = useMemo(() => getChildAgeMonths(birthDate), [birthDate]);
  const [modalTarget, setModalTarget] = useState<{ vaccine: string; dose: number; label: string } | null>(null);

  // Compute all rows
  const milestones = useMemo(() => {
    return MOROCCO_SCHEDULE.map((ms) => ({
      ...ms,
      rows: ms.vaccines.map((sv): ComputedRow => {
        const { status, record } = computeStatus(sv, ms.ageMonths, childAgeMonths, vaccinations);
        return { ...sv, status, record };
      }),
    }));
  }, [vaccinations, childAgeMonths]);

  // Stats
  const totalVaccines = MOROCCO_SCHEDULE.reduce((sum, ms) => sum + ms.vaccines.length, 0);
  const completedCount = milestones.reduce(
    (sum, ms) => sum + ms.rows.filter((r) => r.status === "completed").length,
    0,
  );
  const overdueCount = milestones.reduce(
    (sum, ms) => sum + ms.rows.filter((r) => r.status === "overdue").length,
    0,
  );

  return (
    <div className="space-y-4">
      {/* En-tête avec stats */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-stretch">
          <div className="flex w-14 shrink-0 items-center justify-center bg-healthcare/10">
            <ShieldCheck className="size-6 text-healthcare" />
          </div>
          <div className="flex flex-1 items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Calendrier Vaccinal National</p>
              <p className="text-muted-foreground text-xs">Programme National d&apos;Immunisation — Maroc</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
                <p className="text-muted-foreground text-[10px]">Effectués</p>
              </div>
              <div className="h-8 w-px bg-border" />
              {overdueCount > 0 && (
                <>
                  <div className="text-center">
                    <p className="text-lg font-bold text-destructive">{overdueCount}</p>
                    <p className="text-muted-foreground text-[10px]">En retard</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                </>
              )}
              <div className="text-center">
                <p className="text-lg font-bold">{totalVaccines}</p>
                <p className="text-muted-foreground text-[10px]">Total</p>
              </div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalVaccines) * 100}%` }}
          />
        </div>
      </Card>

      {/* Tableau par étape d'âge */}
      <div className="space-y-3">
        {milestones.map((ms) => (
          <Card key={ms.ageLabel} className="overflow-hidden py-0 gap-0">
            {/* En-tête de groupe */}
            <CardHeader className="border-b bg-muted/30 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Syringe className="size-3.5 text-healthcare" />
                  {ms.ageLabel}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {ms.rows.some((r) => r.status === "overdue") && (
                    <Badge variant="destructive" className="gap-0.5 text-[9px]">
                      <AlertTriangle className="size-2" />
                      {ms.rows.filter((r) => r.status === "overdue").length} en retard
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[9px]">
                    {ms.rows.filter((r) => r.status === "completed").length}/{ms.rows.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Lignes de vaccins */}
            <CardContent className="p-0">
              <div className="divide-y">
                {ms.rows.map((row) => (
                  <div
                    key={`${row.vaccine}-${row.dose}`}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      row.status === "completed"
                        ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                        : row.status === "overdue"
                          ? "bg-red-50/50 dark:bg-red-950/10"
                          : ""
                    }`}
                  >
                    {/* Icône statut */}
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                        row.status === "completed"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                          : row.status === "overdue"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {row.status === "completed" ? (
                        <Check className="size-3" />
                      ) : row.status === "overdue" ? (
                        <AlertTriangle className="size-3" />
                      ) : (
                        <Clock className="size-3" />
                      )}
                    </div>

                    {/* Nom du vaccin */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${row.status === "completed" ? "text-muted-foreground" : "font-medium"}`}>
                        {row.label}
                      </p>
                      {row.record && (
                        <p className="text-muted-foreground text-[11px]">
                          {row.record.date}
                          {row.record.clinicName && <> · {row.record.clinicName}</>}
                          {row.record.healthcareProfessionalName && <> · {row.record.healthcareProfessionalName}</>}
                          {row.record.batchNumber && <> · Lot {row.record.batchNumber}</>}
                        </p>
                      )}
                    </div>

                    {/* Badge + action */}
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={statusBadgeVariant(row.status)}
                        className={`text-[10px] ${
                          row.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                            : ""
                        }`}
                      >
                        {statusLabel(row.status)}
                      </Badge>
                      {row.status !== "completed" && !readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[11px]"
                          onClick={() => setModalTarget({ vaccine: row.vaccine, dose: row.dose, label: row.label })}
                        >
                          <CalendarPlus className="size-3" />
                          <span className="hidden sm:inline">Marquer fait</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal formulaire */}
      {modalTarget && (
        <MarkDoneModal
          childIdentifier={childIdentifier}
          vaccine={modalTarget.vaccine}
          dose={modalTarget.dose}
          label={modalTarget.label}
          onClose={() => setModalTarget(null)}
          onSaved={() => {
            setModalTarget(null);
            onVaccinationAdded?.();
          }}
        />
      )}
    </div>
  );
}

// ── Schéma Zod pour le modal ──────────────────────────────────────────────────

const markDoneSchema = z.object({
  date: z.string().min(1, "La date est requise").refine((v) => !isNaN(Date.parse(v)), "Date invalide"),
  clinicName: z.string().min(1, "Le nom de la clinique est requis").max(120),
  healthcareProfessionalName: z.string().max(120).optional(),
});

type MarkDoneValues = z.infer<typeof markDoneSchema>;

// ── Modal "Marquer fait" ─────────────────────────────────────────────────────

function MarkDoneModal({
  childIdentifier,
  vaccine,
  dose,
  label,
  onClose,
  onSaved,
}: {
  childIdentifier: string;
  vaccine: string;
  dose: number;
  label: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const form = useForm<MarkDoneValues>({
    resolver: zodResolver(markDoneSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      clinicName: "",
      healthcareProfessionalName: "",
    },
  });

  function onSubmit(values: MarkDoneValues) {
    setServerError(null);
    startSaving(async () => {
      const result = await addVaccination({
        childIdentifier,
        vaccine,
        dose,
        date: values.date,
        clinicName: values.clinicName.trim(),
        healthcareProfessionalName: values.healthcareProfessionalName?.trim() || undefined,
      } as AddVaccinationInput);
      if (result.success) {
        await getVaccinations(childIdentifier);
        onSaved();
      } else {
        setServerError(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Syringe className="size-4 text-healthcare" />
                Enregistrer la vaccination
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">{label}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-3 pt-0">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date d&apos;administration</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clinicName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Clinique / Centre de santé</FormLabel>
                    <FormControl>
                      <Input placeholder="ex : CHU Ibn Rochd" className="h-9 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="healthcareProfessionalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Professionnel de santé <span className="text-muted-foreground">(optionnel)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ex : Dr. Alaoui" className="h-9 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError && <p className="text-destructive text-sm">{serverError}</p>}
            </CardContent>
            <div className="flex gap-2 px-6 pb-6 pt-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={isSaving}>
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                disabled={isSaving}
              >
                {isSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}

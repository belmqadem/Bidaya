"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  User,
  Calendar,
  Phone,
  Clock,
  Syringe,
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronUp,
  Baby,
  Weight,
  AlertTriangle,
  Ruler,
  MapPin,
  Hash,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  searchChild,
  addVaccination,
  getVaccinations,
  addConsultation,
  getConsultations,
  type ChildRecord,
  type VaccinationRecord,
  type ConsultationRecord,
} from "./actions";
import { addVaccinationSchema } from "@/lib/schemas/vaccination";
import type { AddVaccinationInput } from "@/lib/schemas/vaccination";
import { addConsultationSchema } from "@/lib/schemas/consultation";
import type { AddConsultationInput } from "@/lib/schemas/consultation";
import type { z } from "zod";
import { VaccinationSchedule } from "./vaccination-schedule";

type VaccinationFormValues = z.input<typeof addVaccinationSchema>;
type ConsultationFormValues = z.input<typeof addConsultationSchema>;

// ── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "schedule" | "vaccinations" | "consultations";

// ── Composant principal ──────────────────────────────────────────────────────

export function ChildSearch() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [child, setChild] = useState<ChildRecord | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("schedule");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setChild(null);
    setVaccinations([]);
    setConsultations([]);
    startTransition(async () => {
      const result = await searchChild(query);
      if (result.found) {
        setChild(result.child);
        setVaccinations(result.vaccinations);
        setConsultations(result.consultations);
      } else {
        setError(result.error);
      }
    });
  }

  async function refreshVaccinations() {
    if (!child) return;
    const list = await getVaccinations(child.identifier);
    setVaccinations(list);
  }

  async function refreshConsultations() {
    if (!child) return;
    const list = await getConsultations(child.identifier);
    setConsultations(list);
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez l'identifiant (ex : CHR-K7NP-3WFG)"
            className="h-11 pl-10"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending || !query.trim()}
          className="h-11 bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
        >
          {isPending ? "Recherche…" : "Rechercher"}
        </Button>
      </form>

      {error && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Search className="size-8 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      )}

      {child && (
        <div className="space-y-5">
          {/* ── Child identity header ─────────────────────────────────── */}
          <div className="rounded-xl border bg-linear-to-br from-healthcare/5 via-transparent to-transparent p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-healthcare/10">
                  <Baby className="size-6 text-healthcare" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">
                    {child.fullName}
                  </h2>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Né{child.gender === "female" ? "e" : ""} le {child.birthDate} · {child.placeOfBirth ?? "Lieu non renseigné"}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 gap-1.5 border-healthcare/30 bg-healthcare/5 px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-healthcare"
              >
                <Hash className="size-3" />
                {child.identifier}
              </Badge>
            </div>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap gap-2">
              <StatChip label="Vaccinations" value={vaccinations.length} icon={Syringe} color="text-healthcare" />
              <StatChip label="Consultations" value={consultations.length} icon={ClipboardList} color="text-blue-600" />
              <StatChip
                label="Sexe"
                value={child.gender === "male" ? "Masculin" : child.gender === "female" ? "Féminin" : "N/D"}
                icon={User}
                color="text-muted-foreground"
              />
              <StatChip
                label="Accouchement"
                value={child.deliveryType}
                icon={Clock}
                color="text-muted-foreground"
              />
            </div>
          </div>

          {/* ── Biometrics + Parent info — two-column ─────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Biometrics card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Ruler className="size-3.5" />
                  Mesures à la naissance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <BiometricCell
                    label="Poids"
                    value={child.birthWeight ? `${child.birthWeight}` : "—"}
                    unit="kg"
                  />
                  <BiometricCell
                    label="Taille"
                    value={child.birthLength ? `${child.birthLength}` : "—"}
                    unit="cm"
                  />
                  <BiometricCell
                    label="PC"
                    value={child.headCircumferenceAtBirth ? `${child.headCircumferenceAtBirth}` : "—"}
                    unit="cm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parent info card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5" />
                  Parent / Tuteur
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{child.parentName}</p>
                      <p className="text-muted-foreground text-xs">Parent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Phone className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{child.parentContact}</p>
                      <p className="text-muted-foreground text-xs">Téléphone</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Tab navigation ────────────────────────────────────────── */}
          <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
            <TabButton
              active={activeTab === "schedule"}
              onClick={() => setActiveTab("schedule")}
              icon={ShieldCheck}
              label="Calendrier vaccinal"
            />
            <TabButton
              active={activeTab === "vaccinations"}
              onClick={() => setActiveTab("vaccinations")}
              icon={Syringe}
              label="Vaccinations"
              count={vaccinations.length}
            />
            <TabButton
              active={activeTab === "consultations"}
              onClick={() => setActiveTab("consultations")}
              icon={Stethoscope}
              label="Consultations"
              count={consultations.length}
            />
          </div>

          {/* ── Tab content ───────────────────────────────────────────── */}
          {activeTab === "schedule" && (
            <VaccinationSchedule
              childIdentifier={child.identifier}
              birthDate={child.birthDate}
              vaccinations={vaccinations}
              onVaccinationAdded={refreshVaccinations}
            />
          )}

          {activeTab === "vaccinations" && (
            <div className="space-y-4">
              <VaccinationList vaccinations={vaccinations} />
              <VaccinationForm
                childIdentifier={child.identifier}
                onAdded={refreshVaccinations}
              />
            </div>
          )}

          {activeTab === "consultations" && (
            <div className="space-y-4">
              <ConsultationList consultations={consultations} />
              <ConsultationForm
                childIdentifier={child.identifier}
                onAdded={refreshConsultations}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge
          variant="secondary"
          className={`ml-0.5 px-1.5 py-0 text-[10px] ${
            active ? "" : "bg-transparent"
          }`}
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5">
      <Icon className={`size-3.5 ${color}`} />
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ── Biometric cell ───────────────────────────────────────────────────────────

function BiometricCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums leading-none">
        {value}
      </p>
      {value !== "—" && (
        <p className="text-muted-foreground mt-0.5 text-[10px]">{unit}</p>
      )}
    </div>
  );
}

// ── Liste des vaccinations ───────────────────────────────────────────────────

function VaccinationList({
  vaccinations,
}: {
  vaccinations: VaccinationRecord[];
}) {
  if (vaccinations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <Syringe className="size-8 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            Aucune vaccination enregistrée.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {vaccinations.map((v) => (
        <Card key={v.id} className="transition-colors hover:bg-muted/20">
          <CardContent className="flex items-start gap-4 py-3.5 px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-healthcare/10 mt-0.5">
              <Syringe className="size-4 text-healthcare" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{v.vaccine}</p>
                <Badge variant="secondary" className="text-[10px]">
                  Dose {v.dose}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                <span className="text-muted-foreground text-xs">{v.clinicName}</span>
                {v.healthcareProfessionalName && (
                  <span className="text-muted-foreground text-xs">· {v.healthcareProfessionalName}</span>
                )}
                {v.batchNumber && (
                  <span className="text-muted-foreground text-xs font-mono">Lot {v.batchNumber}</span>
                )}
                {v.injectionSite && (
                  <span className="text-muted-foreground text-xs">· {v.injectionSite}</span>
                )}
              </div>
              {v.notes && (
                <p className="text-muted-foreground mt-1 text-xs italic">
                  {v.notes}
                </p>
              )}
              {v.nextDoseDate && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Prochaine dose : {v.nextDoseDate}
                  </span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums pt-0.5">
              {v.date}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Formulaire vaccination ───────────────────────────────────────────────────

function VaccinationForm({
  childIdentifier,
  onAdded,
}: {
  childIdentifier: string;
  onAdded: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<VaccinationFormValues>({
    resolver: zodResolver(addVaccinationSchema),
    defaultValues: {
      childIdentifier,
      vaccine: "",
      dose: 1,
      date: new Date().toISOString().split("T")[0],
      clinicName: "",
      nextDoseDate: "",
      healthcareProfessionalName: "",
      batchNumber: "",
      injectionSite: "",
      notes: "",
    },
  });

  function onSubmit(values: VaccinationFormValues) {
    setFormError(null);
    startAdding(async () => {
      const result = await addVaccination({
        ...values,
        childIdentifier,
        dose: Number(values.dose),
      } as AddVaccinationInput);
      if (result.success) {
        form.reset({
          childIdentifier,
          vaccine: "",
          dose: 1,
          date: new Date().toISOString().split("T")[0],
          clinicName: "",
          nextDoseDate: "",
          healthcareProfessionalName: "",
          batchNumber: "",
          injectionSite: "",
          notes: "",
        });
        onAdded();
        setOpen(false);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" /> Ajouter une vaccination
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Plus className="size-4" /> Nouvelle vaccination
          </CardTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-2 gap-4 pt-0">
            <FormField
              control={form.control}
              name="vaccine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nom du vaccin</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex : BCG, DTP"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Dose</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      className="h-9 text-sm"
                      {...field}
                      value={Number(field.value) || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date</FormLabel>
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
                  <FormLabel className="text-xs">Clinique</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex : CHU Ibn Rochd"
                      className="h-9 text-sm"
                      {...field}
                    />
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
                  <FormLabel className="text-xs">Professionnel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex : Dr. Alaoui"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDoseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date prochaine dose</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">N° de lot</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex : AB1234"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="injectionSite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Site d&apos;injection</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex : Cuisse gauche"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-xs">Notes</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Observations complémentaires"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && (
              <p className="col-span-2 text-destructive text-sm">
                {formError}
              </p>
            )}
          </CardContent>
          <div className="px-6 pb-5 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isAdding}
              className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
            >
              {isAdding ? "Enregistrement…" : "Enregistrer la vaccination"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ── Liste des consultations ──────────────────────────────────────────────────

function ConsultationList({
  consultations,
}: {
  consultations: ConsultationRecord[];
}) {
  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10">
          <Stethoscope className="size-8 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            Aucune consultation enregistrée.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {consultations.map((c) => (
        <Card key={c.id} className="transition-colors hover:bg-muted/20">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 mt-0.5">
                  <Stethoscope className="size-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{c.clinicianName}</p>
                    {c.followUpRequired && (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                        Suivi requis
                      </Badge>
                    )}
                  </div>
                  {c.reasonForVisit && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.reasonForVisit}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums pt-0.5">
                {c.date}
              </span>
            </div>

            {/* Details */}
            <div className="mt-3 ml-13 space-y-2">
              {c.diagnosis && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Diagnostic
                  </p>
                  <p className="text-sm mt-0.5">{c.diagnosis}</p>
                </div>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {c.summary}
              </p>
              {c.treatmentPrescribed && (
                <div className="rounded-md border border-healthcare/20 bg-healthcare/5 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-healthcare">
                    Traitement
                  </p>
                  <p className="text-sm mt-0.5">{c.treatmentPrescribed}</p>
                </div>
              )}
              {c.followUpDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">
                    Suivi prévu le {c.followUpDate}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Formulaire consultation ──────────────────────────────────────────────────

function ConsultationForm({
  childIdentifier,
  onAdded,
}: {
  childIdentifier: string;
  onAdded: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(addConsultationSchema),
    defaultValues: {
      childIdentifier,
      date: new Date().toISOString().split("T")[0],
      summary: "",
      clinicianName: "",
      reasonForVisit: "",
      diagnosis: "",
      followUpRequired: false,
      treatmentPrescribed: "",
      followUpDate: "",
    },
  });

  function onSubmit(values: ConsultationFormValues) {
    setFormError(null);
    startAdding(async () => {
      const result = await addConsultation({
        ...values,
        childIdentifier,
      } as AddConsultationInput);
      if (result.success) {
        form.reset({
          childIdentifier,
          date: new Date().toISOString().split("T")[0],
          summary: "",
          clinicianName: "",
          reasonForVisit: "",
          diagnosis: "",
          followUpRequired: false,
          treatmentPrescribed: "",
          followUpDate: "",
        });
        onAdded();
        setOpen(false);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" /> Ajouter une consultation
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Plus className="size-4" /> Nouvelle consultation
          </CardTitle>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              form.reset();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clinicianName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Clinicien</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex : Dr. Benali"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reasonForVisit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Motif de visite</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex : Fièvre, bilan de routine"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Diagnostic</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex : Infection respiratoire"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Résumé</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes de consultation…"
                      rows={3}
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="treatmentPrescribed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Traitement prescrit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="ex : Amoxicilline 250 mg, 3x/jour pendant 7 jours"
                      rows={2}
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date de suivi</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="followUpRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0! text-xs">
                      Suivi nécessaire
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            {formError && (
              <p className="text-destructive text-sm">{formError}</p>
            )}
          </CardContent>
          <div className="px-6 pb-5 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isAdding}
              className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
            >
              {isAdding ? "Enregistrement…" : "Enregistrer la consultation"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

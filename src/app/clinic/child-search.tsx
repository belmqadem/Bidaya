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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

type VaccinationFormValues = z.input<typeof addVaccinationSchema>;
type ConsultationFormValues = z.input<typeof addConsultationSchema>;

// ── Main component ───────────────────────────────────────────────────────────

export function ChildSearch() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [child, setChild] = useState<ChildRecord | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by identifier (e.g. CHR-K7NP-3WFG)"
            className="pl-9"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending || !query.trim()}
          className="bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
        >
          {isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <p className="text-muted-foreground text-center text-sm">{error}</p>
      )}

      {/* Child result */}
      {child && (
        <>
          {/* Summary card */}
          <Card className="border-l-4 border-l-healthcare">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{child.fullName}</CardTitle>
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium tracking-wider">
                  {child.identifier}
                </span>
              </div>
              <CardDescription>Child health record summary</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <InfoRow icon={Calendar} label="Birth date" value={child.birthDate} />
                <InfoRow icon={User} label="Parent" value={child.parentName} />
                <InfoRow icon={Phone} label="Contact" value={child.parentContact} />
                <InfoRow icon={Clock} label="Registered" value={child.createdAt} />
              </dl>
            </CardContent>
          </Card>

          {/* Vaccination section */}
          <VaccinationList vaccinations={vaccinations} />
          <VaccinationForm
            childIdentifier={child.identifier}
            onAdded={refreshVaccinations}
          />

          {/* Consultation section */}
          <ConsultationList consultations={consultations} />
          <ConsultationForm
            childIdentifier={child.identifier}
            onAdded={refreshConsultations}
          />
        </>
      )}
    </div>
  );
}

// ── Vaccination list ─────────────────────────────────────────────────────────

function VaccinationList({
  vaccinations,
}: {
  vaccinations: VaccinationRecord[];
}) {
  if (vaccinations.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-center text-sm">
        No vaccinations recorded yet.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Syringe className="size-4" />
          Vaccinations ({vaccinations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {vaccinations.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <div>
                <p className="font-medium">{v.vaccine}</p>
                <p className="text-muted-foreground text-xs">
                  Dose {v.dose} &middot; {v.clinicName}
                </p>
              </div>
              <span className="text-muted-foreground text-xs">{v.date}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Vaccination form ─────────────────────────────────────────────────────────

function VaccinationForm({
  childIdentifier,
  onAdded,
}: {
  childIdentifier: string;
  onAdded: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

  const form = useForm<VaccinationFormValues>({
    resolver: zodResolver(addVaccinationSchema),
    defaultValues: {
      childIdentifier,
      vaccine: "",
      dose: 1,
      date: new Date().toISOString().split("T")[0],
      clinicName: "",
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
        });
        onAdded();
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Add vaccination
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vaccine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vaccine name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BCG, DTP, Polio" {...field} />
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
                  <FormLabel>Dose number</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={10} {...field} value={Number(field.value) || ""} />
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
                  <FormLabel>Administration date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Clinic name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CHU Ibn Rochd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && (
              <p className="col-span-2 text-destructive text-sm">{formError}</p>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button
              type="submit"
              disabled={isAdding}
              className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
            >
              {isAdding ? "Saving…" : "Save vaccination"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ── Consultation list ────────────────────────────────────────────────────────

function ConsultationList({
  consultations,
}: {
  consultations: ConsultationRecord[];
}) {
  if (consultations.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-center text-sm">
        No consultations recorded yet.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4" />
          Consultations ({consultations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {consultations.map((c) => (
            <div key={c.id} className="px-6 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{c.clinicianName}</p>
                <span className="text-muted-foreground text-xs">{c.date}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {c.summary}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Consultation form ────────────────────────────────────────────────────────

function ConsultationForm({
  childIdentifier,
  onAdded,
}: {
  childIdentifier: string;
  onAdded: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(addConsultationSchema),
    defaultValues: {
      childIdentifier,
      date: new Date().toISOString().split("T")[0],
      summary: "",
      clinicianName: "",
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
        });
        onAdded();
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Add consultation
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Clinician name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dr. Benali" {...field} />
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
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief consultation notes…"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && (
              <p className="text-destructive text-sm">{formError}</p>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button
              type="submit"
              disabled={isAdding}
              className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
            >
              {isAdding ? "Saving…" : "Save consultation"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div>
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

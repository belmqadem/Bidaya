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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
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
import { VaccinationSchedule } from "./vaccination-schedule";

type VaccinationFormValues = z.input<typeof addVaccinationSchema>;
type ConsultationFormValues = z.input<typeof addConsultationSchema>;

// ── Composant principal ──────────────────────────────────────────────────────

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
    <div className="space-y-6">
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par identifiant (ex : CHR-K7NP-3WFG)"
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
        <p className="text-muted-foreground text-center text-sm">{error}</p>
      )}

      {child && (
        <div className="space-y-6">
          {/* Carte résumé */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{child.fullName}</CardTitle>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Carnet de santé numérique — vérifié par la clinique
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-healthcare/10 px-3 py-1.5 font-mono text-xs font-semibold tracking-wider text-healthcare">
                  {child.identifier}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCell icon={Calendar} label="Date de naissance" value={child.birthDate} />
                <InfoCell icon={Baby} label="Sexe" value={child.gender} />
                <InfoCell icon={Weight} label="Poids" value={child.birthWeight ? `${child.birthWeight} kg` : "N/D"} />
                <InfoCell icon={Ruler} label="Taille" value={child.birthLength ? `${child.birthLength} cm` : "N/D"} />
                <InfoCell icon={Ruler} label="Périmètre crânien" value={child.headCircumferenceAtBirth ? `${child.headCircumferenceAtBirth} cm` : "N/D"} />
                <InfoCell icon={Clock} label="Accouchement" value={child.deliveryType} />
                {child.placeOfBirth && <InfoCell icon={MapPin} label="Lieu de naissance" value={child.placeOfBirth} />}
                <InfoCell icon={User} label="Parent" value={child.parentName} />
                <InfoCell icon={Phone} label="Contact" value={child.parentContact} />
              </div>
            </CardContent>
          </Card>

          {/* Calendrier vaccinal */}
          <section className="space-y-3">
            <VaccinationSchedule
              childIdentifier={child.identifier}
              birthDate={child.birthDate}
              vaccinations={vaccinations}
              onVaccinationAdded={refreshVaccinations}
            />
          </section>

          {/* Vaccinations */}
          <section className="space-y-3">
            <SectionHeading icon={Syringe} title="Vaccinations" count={vaccinations.length} />
            <VaccinationList vaccinations={vaccinations} />
            <VaccinationForm childIdentifier={child.identifier} onAdded={refreshVaccinations} />
          </section>

          {/* Consultations */}
          <section className="space-y-3">
            <SectionHeading icon={ClipboardList} title="Consultations" count={consultations.length} />
            <ConsultationList consultations={consultations} />
            <ConsultationForm childIdentifier={child.identifier} onAdded={refreshConsultations} />
          </section>
        </div>
      )}
    </div>
  );
}

// ── En-tête de section ───────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, count }: { icon: React.ComponentType<{ className?: string }>; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-healthcare" />
      <h2 className="text-base font-semibold">{title}</h2>
      {count > 0 && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

// ── Liste des vaccinations ───────────────────────────────────────────────────

function VaccinationList({ vaccinations }: { vaccinations: VaccinationRecord[] }) {
  if (vaccinations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center text-sm">Aucune vaccination enregistrée.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {vaccinations.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{v.vaccine}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Dose {v.dose} &middot; {v.clinicName}
                  {v.healthcareProfessionalName && <> &middot; {v.healthcareProfessionalName}</>}
                  {v.batchNumber && <> &middot; Lot {v.batchNumber}</>}
                  {v.injectionSite && <> &middot; {v.injectionSite}</>}
                </p>
                {v.notes && (
                  <p className="text-muted-foreground mt-0.5 text-xs italic">{v.notes}</p>
                )}
                {v.nextDoseDate && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="size-3" /> Prochaine dose : {v.nextDoseDate}
                  </p>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 pl-4 text-xs tabular-nums">{v.date}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Formulaire vaccination ───────────────────────────────────────────────────

function VaccinationForm({ childIdentifier, onAdded }: { childIdentifier: string; onAdded: () => void }) {
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
        form.reset({ childIdentifier, vaccine: "", dose: 1, date: new Date().toISOString().split("T")[0], clinicName: "", nextDoseDate: "", healthcareProfessionalName: "", batchNumber: "", injectionSite: "", notes: "" });
        onAdded();
        setOpen(false);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 size-3.5" /> Ajouter une vaccination
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium"><Plus className="size-4" /> Nouvelle vaccination</CardTitle>
          <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-2 gap-3 pt-0">
            <FormField control={form.control} name="vaccine" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Nom du vaccin</FormLabel>
                <FormControl><Input placeholder="ex : BCG, DTP" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dose" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Dose</FormLabel>
                <FormControl><Input type="number" min={1} max={10} className="h-9 text-sm" {...field} value={Number(field.value) || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Date</FormLabel>
                <FormControl><Input type="date" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="clinicName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Clinique</FormLabel>
                <FormControl><Input placeholder="ex : CHU Ibn Rochd" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="healthcareProfessionalName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Professionnel</FormLabel>
                <FormControl><Input placeholder="ex : Dr. Alaoui" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nextDoseDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Date prochaine dose</FormLabel>
                <FormControl><Input type="date" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="batchNumber" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">N° de lot</FormLabel>
                <FormControl><Input placeholder="ex : AB1234" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="injectionSite" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Site d&apos;injection</FormLabel>
                <FormControl><Input placeholder="ex : Cuisse gauche" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel className="text-xs">Notes</FormLabel>
                <FormControl><Input placeholder="Observations complémentaires" className="h-9 text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {formError && <p className="col-span-2 text-destructive text-sm">{formError}</p>}
          </CardContent>
          <div className="px-5 pb-5 pt-2">
            <Button type="submit" size="sm" disabled={isAdding} className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90">
              {isAdding ? "Enregistrement…" : "Enregistrer la vaccination"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ── Liste des consultations ──────────────────────────────────────────────────

function ConsultationList({ consultations }: { consultations: ConsultationRecord[] }) {
  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center text-sm">Aucune consultation enregistrée.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {consultations.map((c) => (
            <div key={c.id} className="px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{c.clinicianName}</p>
                  {c.followUpRequired && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Suivi</span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">{c.date}</span>
              </div>
              {c.reasonForVisit && <p className="text-muted-foreground mt-0.5 text-xs">Motif : {c.reasonForVisit}</p>}
              {c.diagnosis && <p className="mt-0.5 text-xs font-medium">Dx : {c.diagnosis}</p>}
              {c.treatmentPrescribed && <p className="text-muted-foreground mt-0.5 text-xs">Traitement : {c.treatmentPrescribed}</p>}
              {c.followUpDate && <p className="mt-0.5 text-xs text-amber-600">Suivi prévu le : {c.followUpDate}</p>}
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{c.summary}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Formulaire consultation ──────────────────────────────────────────────────

function ConsultationForm({ childIdentifier, onAdded }: { childIdentifier: string; onAdded: () => void }) {
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
        form.reset({ childIdentifier, date: new Date().toISOString().split("T")[0], summary: "", clinicianName: "", reasonForVisit: "", diagnosis: "", followUpRequired: false, treatmentPrescribed: "", followUpDate: "" });
        onAdded();
        setOpen(false);
      } else {
        setFormError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 size-3.5" /> Ajouter une consultation
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium"><Plus className="size-4" /> Nouvelle consultation</CardTitle>
          <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date</FormLabel>
                  <FormControl><Input type="date" className="h-9 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="clinicianName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Clinicien</FormLabel>
                  <FormControl><Input placeholder="ex : Dr. Benali" className="h-9 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="reasonForVisit" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Motif de visite</FormLabel>
                  <FormControl><Input placeholder="ex : Fièvre, bilan de routine" className="h-9 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="diagnosis" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Diagnostic</FormLabel>
                  <FormControl><Input placeholder="ex : Infection respiratoire" className="h-9 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="summary" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Résumé</FormLabel>
                <FormControl><Textarea placeholder="Notes de consultation…" rows={3} className="text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="treatmentPrescribed" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Traitement prescrit</FormLabel>
                <FormControl><Textarea placeholder="ex : Amoxicilline 250 mg, 3x/jour pendant 7 jours" rows={2} className="text-sm" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="followUpDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Date de suivi</FormLabel>
                  <FormControl><Input type="date" className="h-9 text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="followUpRequired" render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 text-xs">Suivi nécessaire</FormLabel>
                </FormItem>
              )} />
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
          </CardContent>
          <div className="px-5 pb-5 pt-2">
            <Button type="submit" size="sm" disabled={isAdding} className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90">
              {isAdding ? "Enregistrement…" : "Enregistrer la consultation"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// ── Partagé ──────────────────────────────────────────────────────────────────

function InfoCell({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

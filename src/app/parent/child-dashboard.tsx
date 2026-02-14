"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  User,
  Calendar,
  Phone,
  Copy,
  Check,
  Loader2,
  Baby,
  Weight,
  Activity,
  Syringe,
  Stethoscope,
  Heart,
  AlertTriangle,
  CalendarClock,
  Truck,
  Ruler,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getMyChild,
  type ChildProfile,
  type VaccinationEntry,
  type ConsultationEntry,
} from "./actions";
import { MedicalTimeline } from "./medical-timeline";
import { VaccinationSchedule } from "../clinic/vaccination-schedule";

// ── Composant principal ──────────────────────────────────────────────────────

export function ChildDashboard() {
  const [isPending, startTransition] = useTransition();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sticky header visibility
  const profileRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const result = await getMyChild();
      if (result.found) {
        setChild(result.child);
        setVaccinations(result.vaccinations);
        setConsultations(result.consultations);
      } else {
        setError(result.error);
      }
    });
  }, []);

  // Intersection observer for sticky child bar
  useEffect(() => {
    const el = profileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [child]);

  if (isPending && !child) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-healthcare/20" />
          <div className="relative flex size-12 items-center justify-center rounded-full bg-healthcare/10">
            <Loader2 className="size-5 animate-spin text-healthcare" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Chargement du dossier…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <AlertTriangle className="size-8 text-destructive/60" />
          <p className="text-muted-foreground text-center text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!child) return null;

  const latestVacc = vaccinations[0] ?? null;
  const latestConsult = consultations[0] ?? null;

  return (
    <>
      {/* ── Sticky child bar ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-x-0 top-[49px] z-30 border-b bg-background/95 backdrop-blur-sm transition-all duration-300 print:hidden ${
          showSticky
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-full bg-healthcare/10">
              <Heart className="size-3.5 text-healthcare" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{child.fullName}</p>
              <p className="text-muted-foreground text-[11px]">{child.identifier}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Syringe className="size-2.5" /> {vaccinations.length}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Stethoscope className="size-2.5" /> {consultations.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Carte profil ───────────────────────────────────────────── */}
        <div ref={profileRef}>
          <ChildProfileCard child={child} />
        </div>

        {/* ── Résumé rapide ──────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            icon={Syringe}
            iconBg="bg-healthcare/10"
            iconColor="text-healthcare"
            title="Dernière vaccination"
            empty="Aucune vaccination"
            entry={
              latestVacc
                ? {
                    primary: latestVacc.vaccine,
                    secondary: `${ordinalFr(latestVacc.dose)} dose · ${latestVacc.clinicName}`,
                    date: latestVacc.date,
                    badge:
                      latestVacc.nextDoseDate && new Date(latestVacc.nextDoseDate) < new Date()
                        ? { label: "Rappel en retard", variant: "destructive" as const }
                        : null,
                  }
                : null
            }
          />
          <SummaryCard
            icon={Stethoscope}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            title="Dernière consultation"
            empty="Aucune consultation"
            entry={
              latestConsult
                ? {
                    primary: latestConsult.clinicianName,
                    secondary: latestConsult.reasonForVisit || latestConsult.summary.slice(0, 60),
                    date: latestConsult.date,
                    badge: latestConsult.followUpRequired
                      ? { label: "Suivi requis", variant: "destructive" as const }
                      : null,
                  }
                : null
            }
          />
        </div>

        {/* ── Calendrier vaccinal ──────────────────────────────────── */}
        <VaccinationSchedule
          childIdentifier={child.identifier}
          birthDate={child.birthDate}
          vaccinations={vaccinations}
          readOnly
        />

        {/* ── En-tête chronologie ────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 pt-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-healthcare/10">
            <Activity className="size-3.5 text-healthcare" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-none">Chronologie Médicale</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {vaccinations.length + consultations.length} événement{vaccinations.length + consultations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Timeline ───────────────────────────────────────────────── */}
        <MedicalTimeline vaccinations={vaccinations} consultations={consultations} />
      </div>
    </>
  );
}

// ── Carte résumé ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  empty,
  entry,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  empty: string;
  entry: {
    primary: string;
    secondary: string;
    date: string;
    badge: { label: string; variant: "destructive" | "secondary" } | null;
  } | null;
}) {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <div className="flex items-stretch">
        <div className={`flex w-12 shrink-0 items-center justify-center ${iconBg}`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <div className="flex-1 px-4 py-3.5">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{title}</p>
          {entry ? (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{entry.primary}</p>
                {entry.badge && (
                  <Badge variant={entry.badge.variant} className="gap-0.5 text-[9px] px-1.5 py-0">
                    <AlertTriangle className="size-2" />
                    {entry.badge.label}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{entry.secondary}</p>
              <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">{entry.date}</p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs italic">{empty}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Carte profil enfant ──────────────────────────────────────────────────────

function ChildProfileCard({ child }: { child: ChildProfile }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(child.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Initiales pour l'avatar
  const initials = child.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="overflow-hidden print:shadow-none print:border">
      {/* Hero band */}
      <div className="relative bg-gradient-to-br from-healthcare/8 via-healthcare/4 to-transparent px-6 pt-6 pb-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-healthcare text-healthcare-foreground shadow-md sm:size-16">
            <span className="text-lg font-bold sm:text-xl">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{child.fullName}</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Carnet de santé numérique — vérifié par la clinique</p>
              </div>
              <button
                type="button"
                onClick={copyId}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-healthcare shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md print:hidden"
              >
                {child.identifier}
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
              <span className="hidden font-mono text-xs font-semibold tracking-wider text-healthcare print:inline">
                {child.identifier}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="pt-5">
        {/* Info enfant */}
        <div className="mb-4">
          <p className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">Informations enfant</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <InfoCell icon={Calendar} label="Naissance" value={child.birthDate} />
            <InfoCell icon={Baby} label="Sexe" value={child.gender} />
            <InfoCell icon={Weight} label="Poids" value={child.birthWeight ? `${child.birthWeight} kg` : "N/D"} />
            <InfoCell icon={Ruler} label="Taille" value={child.birthLength ? `${child.birthLength} cm` : "N/D"} />
            <InfoCell icon={Ruler} label="Périmètre crânien" value={child.headCircumferenceAtBirth ? `${child.headCircumferenceAtBirth} cm` : "N/D"} />
            <InfoCell icon={Truck} label="Accouchement" value={child.deliveryType} />
            {child.placeOfBirth && <InfoCell icon={MapPin} label="Lieu de naissance" value={child.placeOfBirth} />}
          </div>
        </div>

        {/* Info parent */}
        <div>
          <p className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">Informations parent</p>
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCell icon={User} label="Nom" value={child.parentName} />
            <InfoCell icon={Phone} label="Téléphone" value={child.parentContact} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Cellule info ─────────────────────────────────────────────────────────────

function InfoCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
      <Icon className="text-muted-foreground size-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="truncate text-[13px] font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ── Helper ───────────────────────────────────────────────────────────────────

function ordinalFr(n: number) {
  if (n === 1) return "1re";
  return `${n}e`;
}

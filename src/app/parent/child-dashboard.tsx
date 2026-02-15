"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Phone,
  Copy,
  Check,
  Loader2,
  Baby,
  Activity,
  Syringe,
  Stethoscope,
  Heart,
  AlertTriangle,
  Ruler,
  MapPin,
  MessageCircleWarning,
  FileText,
  ChevronRight,
  ShieldCheck,
  Hash,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMyChild,
  type ChildProfile,
  type VaccinationEntry,
  type ConsultationEntry,
} from "./actions";
import { getMyReports, type ReportSummary } from "./report-actions";
import { MedicalTimeline } from "./medical-timeline";
import { VaccinationSchedule } from "../clinic/vaccination-schedule";

// ── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "schedule" | "timeline" | "reports";

// ── Composant principal ──────────────────────────────────────────────────────

export function ChildDashboard() {
  const [isPending, startTransition] = useTransition();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Sticky header visibility
  const profileRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const [childResult, reportsResult] = await Promise.all([
        getMyChild(),
        getMyReports(),
      ]);
      if (childResult.found) {
        setChild(childResult.child);
        setVaccinations(childResult.vaccinations);
        setConsultations(childResult.consultations);
      } else {
        setError(childResult.error);
      }
      setReports(reportsResult);
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
        <p className="text-muted-foreground text-sm">
          Chargement du dossier…
        </p>
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
  const openReports = reports.filter(
    (r) => r.status === "open" || r.status === "replied",
  ).length;

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
              <p className="truncate text-sm font-semibold">
                {child.fullName}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {child.identifier}
              </p>
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

      <div className="space-y-5">
        {/* ── Profile header ───────────────────────────────────────── */}
        <div ref={profileRef}>
          <ProfileHeader child={child} />
        </div>

        {/* ── Quick stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <QuickStat
            icon={Syringe}
            color="text-healthcare"
            bg="bg-healthcare/10"
            value={vaccinations.length}
            label="Vaccinations"
          />
          <QuickStat
            icon={Stethoscope}
            color="text-blue-600"
            bg="bg-blue-50"
            value={consultations.length}
            label="Consultations"
          />
          <QuickStat
            icon={MessageCircleWarning}
            color="text-amber-600"
            bg="bg-amber-50"
            value={reports.length}
            label="Signalements"
            alert={openReports > 0 ? openReports : undefined}
          />
        </div>

        {/* ── Tab navigation ───────────────────────────────────────── */}
        <div className="flex gap-1 rounded-xl border bg-muted/50 p-1 print:hidden">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={Heart}
            label="Aperçu"
          />
          <TabButton
            active={activeTab === "schedule"}
            onClick={() => setActiveTab("schedule")}
            icon={ShieldCheck}
            label="Vaccins"
          />
          <TabButton
            active={activeTab === "timeline"}
            onClick={() => setActiveTab("timeline")}
            icon={Activity}
            label="Historique"
          />
          <TabButton
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
            icon={MessageCircleWarning}
            label="Signalements"
            count={openReports || undefined}
          />
        </div>

        {/* ── Tab content ──────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Last events */}
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                icon={Syringe}
                iconBg="bg-healthcare/10"
                iconColor="text-healthcare"
                title="Dernière vaccination"
                empty="Aucune vaccination enregistrée"
                entry={
                  latestVacc
                    ? {
                        primary: latestVacc.vaccine,
                        secondary: `${ordinalFr(latestVacc.dose)} dose · ${latestVacc.clinicName}`,
                        date: latestVacc.date,
                        badge:
                          latestVacc.nextDoseDate &&
                          new Date(latestVacc.nextDoseDate) < new Date()
                            ? { label: "Rappel en retard", variant: "destructive" as const }
                            : null,
                      }
                    : null
                }
              />
              <SummaryCard
                icon={Stethoscope}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                title="Dernière consultation"
                empty="Aucune consultation enregistrée"
                entry={
                  latestConsult
                    ? {
                        primary: latestConsult.clinicianName,
                        secondary:
                          latestConsult.reasonForVisit ||
                          latestConsult.summary.slice(0, 60),
                        date: latestConsult.date,
                        badge: latestConsult.followUpRequired
                          ? { label: "Suivi requis", variant: "destructive" as const }
                          : null,
                      }
                    : null
                }
              />
            </div>

            {/* Child info */}
            <div className="grid gap-4 sm:grid-cols-2">
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
                      value={
                        child.headCircumferenceAtBirth
                          ? `${child.headCircumferenceAtBirth}`
                          : "—"
                      }
                      unit="cm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <User className="size-3.5" />
                    Parent / Tuteur
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <User className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {child.parentName}
                      </p>
                      <p className="text-muted-foreground text-xs">Parent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Phone className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {child.parentContact}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Téléphone
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional info chips */}
            <div className="flex flex-wrap gap-2">
              <InfoChip icon={Calendar} label="Naissance" value={child.birthDate} />
              <InfoChip
                icon={Baby}
                label="Sexe"
                value={child.gender === "male" ? "Masculin" : child.gender === "female" ? "Féminin" : "N/D"}
              />
              <InfoChip icon={Clock} label="Accouchement" value={child.deliveryType} />
              {child.placeOfBirth && (
                <InfoChip icon={MapPin} label="Lieu" value={child.placeOfBirth} />
              )}
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <VaccinationSchedule
            childIdentifier={child.identifier}
            birthDate={child.birthDate}
            vaccinations={vaccinations}
            readOnly
          />
        )}

        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-healthcare/10">
                <Activity className="size-3.5 text-healthcare" />
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-none">
                  Chronologie Médicale
                </h2>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {vaccinations.length + consultations.length} événement
                  {vaccinations.length + consultations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <MedicalTimeline
              vaccinations={vaccinations}
              consultations={consultations}
            />
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Header + CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50">
                  <MessageCircleWarning className="size-3.5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">
                    Signalements post-vaccination
                  </h2>
                  <p className="text-muted-foreground text-[11px]">
                    {reports.length > 0
                      ? `${reports.length} signalement${reports.length > 1 ? "s" : ""} · ${openReports > 0 ? `${openReports} en attente` : "tous traités"}`
                      : "Aucun effet indésirable signalé"}
                  </p>
                </div>
              </div>
              <Link href="/parent/report/new">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600"
                >
                  <AlertTriangle className="size-3.5" />
                  Signaler
                </Button>
              </Link>
            </div>

            {reports.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60">
                    <MessageCircleWarning className="size-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium">Aucun signalement</p>
                  <p className="text-muted-foreground text-xs text-center max-w-xs">
                    Si votre enfant présente des effets indésirables après une
                    vaccination, signalez-le ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-2.5">
                {reports.map((r) => {
                  const sevStrip =
                    r.severity === "severe"
                      ? "border-l-red-500"
                      : r.severity === "moderate"
                        ? "border-l-orange-400"
                        : "border-l-yellow-400";
                  const sevBg =
                    r.severity === "severe"
                      ? "bg-red-50 text-red-700"
                      : r.severity === "moderate"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-yellow-50 text-yellow-700";
                  const sevDot =
                    r.severity === "severe"
                      ? "bg-red-500"
                      : r.severity === "moderate"
                        ? "bg-orange-400"
                        : "bg-yellow-400";
                  const sevLabel =
                    r.severity === "severe"
                      ? "Sévère"
                      : r.severity === "moderate"
                        ? "Modéré"
                        : "Léger";
                  const statBg =
                    r.status === "open"
                      ? "bg-blue-50 text-blue-700"
                      : r.status === "replied"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.status === "prescribed"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-gray-100 text-gray-600";
                  const statLabel =
                    r.status === "open"
                      ? "En attente"
                      : r.status === "replied"
                        ? "Répondu"
                        : r.status === "prescribed"
                          ? "Ordonnance"
                          : "Fermé";

                  return (
                    <Link key={r.id} href={`/parent/report/${r.id}`}>
                      <Card
                        className={`border-l-4 ${sevStrip} transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                      >
                        <CardContent className="py-3.5 px-4">
                          {/* Row 1 */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                  r.severity === "severe"
                                    ? "bg-red-50"
                                    : r.severity === "moderate"
                                      ? "bg-orange-50"
                                      : "bg-yellow-50"
                                }`}
                              >
                                <AlertTriangle
                                  className={`size-3.5 ${
                                    r.severity === "severe"
                                      ? "text-red-500"
                                      : r.severity === "moderate"
                                        ? "text-orange-500"
                                        : "text-yellow-500"
                                  }`}
                                />
                              </div>
                              <p className="text-sm font-medium truncate">
                                {r.vaccineName ?? "Vaccination non précisée"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-muted-foreground text-[11px]">
                                {r.createdAt}
                              </span>
                              <ChevronRight className="size-3.5 text-muted-foreground/50" />
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-muted-foreground text-xs mt-2 line-clamp-2 leading-relaxed pl-10.5">
                            {r.description}
                          </p>

                          {/* Badges */}
                          <div className="flex items-center gap-2 mt-2.5 pl-10.5">
                            <Badge
                              variant="secondary"
                              className={`gap-1 text-[10px] px-2 py-0.5 ${sevBg} border-0`}
                            >
                              <span
                                className={`inline-block size-1.5 rounded-full ${sevDot}`}
                              />
                              {sevLabel}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-2 py-0.5 ${statBg} border-0`}
                            >
                              {statLabel}
                            </Badge>
                            {r.hasPrescription && (
                              <Badge
                                variant="secondary"
                                className="gap-1 text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-0"
                              >
                                <FileText className="size-3" />
                                Ordonnance
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Profile header ───────────────────────────────────────────────────────────

function ProfileHeader({ child }: { child: ChildProfile }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(child.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const initials = child.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border bg-linear-to-br from-healthcare/6 via-healthcare/3 to-transparent p-5">
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-healthcare text-healthcare-foreground shadow-md">
          <span className="text-lg font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {child.fullName}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Né{child.gender === "female" ? "e" : ""} le {child.birthDate}{" "}
                {child.placeOfBirth ? `· ${child.placeOfBirth}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-healthcare shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:shadow-md print:hidden"
            >
              <Hash className="size-3" />
              {child.identifier}
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Carnet de santé numérique — vérifié par la clinique
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Quick stat ───────────────────────────────────────────────────────────────

function QuickStat({
  icon: Icon,
  color,
  bg,
  value,
  label,
  alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  value: number;
  label: string;
  alert?: number;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex flex-col items-center py-4 px-2">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${bg}`}
        >
          <Icon className={`size-5 ${color}`} />
        </div>
        <p className="mt-2 text-2xl font-bold tabular-nums leading-none">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-[11px]">{label}</p>
        {alert !== undefined && alert > 0 && (
          <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
            {alert}
          </div>
        )}
      </CardContent>
    </Card>
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
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

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
    <Card>
      <CardContent className="py-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`flex size-7 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className={`size-3.5 ${iconColor}`} />
          </div>
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            {title}
          </p>
        </div>
        {entry ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{entry.primary}</p>
              {entry.badge && (
                <Badge
                  variant={entry.badge.variant}
                  className="gap-0.5 text-[9px] px-1.5 py-0"
                >
                  <AlertTriangle className="size-2" />
                  {entry.badge.label}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {entry.secondary}
            </p>
            <p className="text-muted-foreground mt-1.5 text-[11px] tabular-nums">
              {entry.date}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs italic">{empty}</p>
        )}
      </CardContent>
    </Card>
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

// ── Info chip ────────────────────────────────────────────────────────────────

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

// ── Helper ───────────────────────────────────────────────────────────────────

function ordinalFr(n: number) {
  if (n === 1) return "1re";
  return `${n}e`;
}

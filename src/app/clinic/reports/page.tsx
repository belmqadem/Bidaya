"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  XCircle,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getOpenReports, type ReportListItem } from "../report-actions";

/* ── Labels ───────────────────────────────────────────────────────────────── */

const SEVERITY: Record<
  string,
  { label: string; dot: string; strip: string; bg: string }
> = {
  mild: {
    label: "Léger",
    dot: "bg-yellow-400",
    strip: "border-l-yellow-400",
    bg: "bg-yellow-50 text-yellow-700",
  },
  moderate: {
    label: "Modéré",
    dot: "bg-orange-400",
    strip: "border-l-orange-400",
    bg: "bg-orange-50 text-orange-700",
  },
  severe: {
    label: "Sévère",
    dot: "bg-red-500",
    strip: "border-l-red-500",
    bg: "bg-red-50 text-red-700",
  },
};

const STATUS: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
  }
> = {
  open: { label: "En attente", icon: Clock, bg: "bg-blue-50 text-blue-700" },
  replied: {
    label: "Répondu",
    icon: CheckCircle2,
    bg: "bg-emerald-50 text-emerald-700",
  },
  prescribed: {
    label: "Ordonnance",
    icon: FileText,
    bg: "bg-purple-50 text-purple-700",
  },
  closed: {
    label: "Fermé",
    icon: XCircle,
    bg: "bg-gray-100 text-gray-600",
  },
};

const FILTER_TABS = [
  { value: "all", label: "Tous" },
  { value: "open", label: "En attente" },
  { value: "replied", label: "Répondu" },
  { value: "prescribed", label: "Ordonnance" },
  { value: "closed", label: "Fermé" },
] as const;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ClinicReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getOpenReports().then((r) => {
      setReports(r);
      setLoading(false);
    });
  }, []);

  const filtered =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  const countByStatus = (s: string) =>
    reports.filter((r) => r.status === s).length;
  const openCount = countByStatus("open");
  const repliedCount = countByStatus("replied");
  const prescribedCount = countByStatus("prescribed");

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link href="/clinic">
          <Button variant="ghost" size="icon-sm" className="mt-1">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">
            Signalements post-vaccination
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Suivez et traitez les effets indésirables signalés par les parents
          </p>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatMini
            label="En attente"
            value={openCount}
            accent="text-blue-600"
            bg="bg-blue-50"
            pulse={openCount > 0}
          />
          <StatMini
            label="Répondus"
            value={repliedCount}
            accent="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatMini
            label="Ordonnances"
            value={prescribedCount}
            accent="text-purple-600"
            bg="bg-purple-50"
          />
        </div>
      )}

      {/* ── Filter tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === "all" ? reports.length : countByStatus(tab.value);
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`inline-flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-healthcare" />
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60">
              <Inbox className="size-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Aucun signalement</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {statusFilter !== "all"
                  ? "Aucun signalement avec ce statut."
                  : "Les parents n'ont signalé aucun effet indésirable."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Report Card ──────────────────────────────────────────────────────────── */

function ReportCard({ report: r }: { report: ReportListItem }) {
  const sev = SEVERITY[r.severity] ?? SEVERITY.mild;
  const stat = STATUS[r.status] ?? STATUS.open;
  const StatIcon = stat.icon;

  return (
    <Link href={`/clinic/reports/${r.id}`}>
      <Card
        className={`border-l-4 ${sev.strip} transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
      >
        <CardContent className="py-4 px-4">
          {/* Row 1: child name + severity + date */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  r.severity === "severe"
                    ? "bg-red-50"
                    : r.severity === "moderate"
                      ? "bg-orange-50"
                      : "bg-yellow-50"
                }`}
              >
                <AlertTriangle
                  className={`size-4 ${
                    r.severity === "severe"
                      ? "text-red-500"
                      : r.severity === "moderate"
                        ? "text-orange-500"
                        : "text-yellow-500"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{r.childName}</p>
                <p className="text-muted-foreground text-[11px]">
                  {r.childIdentifier}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground text-[11px]">
                {relativeDate(r.createdAt)}
              </span>
              <ChevronRight className="size-4 text-muted-foreground/50" />
            </div>
          </div>

          {/* Row 2: description */}
          <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed line-clamp-2 pl-11.5">
            {r.vaccineName && (
              <span className="font-medium text-foreground/70">
                {r.vaccineName} —{" "}
              </span>
            )}
            {r.description}
          </p>

          {/* Row 3: badges */}
          <div className="mt-3 flex items-center gap-2 pl-11.5">
            <Badge
              variant="secondary"
              className={`gap-1 text-[10px] px-2 py-0.5 ${sev.bg} border-0`}
            >
              <span
                className={`inline-block size-1.5 rounded-full ${sev.dot}`}
              />
              {sev.label}
            </Badge>
            <Badge
              variant="secondary"
              className={`gap-1 text-[10px] px-2 py-0.5 ${stat.bg} border-0`}
            >
              <StatIcon className="size-3" />
              {stat.label}
            </Badge>
            {r.messageCount > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] px-2 py-0.5"
              >
                <MessageSquare className="size-3" />
                {r.messageCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ── Stat mini card ───────────────────────────────────────────────────────── */

function StatMini({
  label,
  value,
  accent,
  bg,
  pulse,
}: {
  label: string;
  value: number;
  accent: string;
  bg: string;
  pulse?: boolean;
}) {
  return (
    <div className={`relative rounded-xl ${bg} px-4 py-3 text-center`}>
      <p className={`text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-muted-foreground mt-0.5 text-[10px] font-medium uppercase tracking-wider">
        {label}
      </p>
      {pulse && value > 0 && (
        <span className="absolute right-2 top-2 flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
        </span>
      )}
    </div>
  );
}

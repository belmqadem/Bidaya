"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Syringe,
  Stethoscope,
  Search,
  Filter,
  ChevronDown,
  AlertTriangle,
  CalendarClock,
  Printer,
  FileText,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VaccinationEntry, ConsultationEntry } from "./actions";

// ── Types ────────────────────────────────────────────────────────────────────

type TimelineEvent =
  | { type: "vaccination"; date: string; data: VaccinationEntry }
  | { type: "consultation"; date: string; data: ConsultationEntry };

type FilterMode = "all" | "vaccination" | "consultation";

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupByPeriod(events: TimelineEvent[]): { label: string; events: TimelineEvent[] }[] {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const groups: Record<string, TimelineEvent[]> = {};

  for (const event of events) {
    const d = new Date(event.date);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    let label: string;

    if (ym === thisMonth) {
      label = "Ce mois-ci";
    } else if (d >= threeMonthsAgo) {
      label = "3 derniers mois";
    } else {
      label = String(d.getFullYear());
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(event);
  }

  const order = ["Ce mois-ci", "3 derniers mois"];
  const yearLabels = Object.keys(groups)
    .filter((l) => !order.includes(l))
    .sort((a, b) => Number(b) - Number(a));

  return [...order, ...yearLabels]
    .filter((l) => groups[l]?.length)
    .map((label) => ({ label, events: groups[label] }));
}

function ordinalFr(n: number) {
  if (n === 1) return "1re";
  return `${n}e`;
}

function formatDateFr(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ── Composant principal ──────────────────────────────────────────────────────

export function MedicalTimeline({
  vaccinations,
  consultations,
}: {
  vaccinations: VaccinationEntry[];
  consultations: ConsultationEntry[];
}) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fusionner et trier
  const allEvents = useMemo<TimelineEvent[]>(() => {
    const vacc: TimelineEvent[] = vaccinations.map((v) => ({ type: "vaccination", date: v.date, data: v }));
    const cons: TimelineEvent[] = consultations.map((c) => ({ type: "consultation", date: c.date, data: c }));
    return [...vacc, ...cons].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vaccinations, consultations]);

  // Filtrer
  const filtered = useMemo(() => {
    let items = allEvents;
    if (filter !== "all") items = items.filter((e) => e.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((e) => {
        if (e.type === "vaccination") {
          const d = e.data as VaccinationEntry;
          return (
            d.vaccine.toLowerCase().includes(q) ||
            d.clinicName.toLowerCase().includes(q) ||
            d.date.includes(q) ||
            (d.healthcareProfessionalName?.toLowerCase().includes(q) ?? false)
          );
        }
        const d = e.data as ConsultationEntry;
        return (
          d.clinicianName.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.date.includes(q) ||
          d.reasonForVisit.toLowerCase().includes(q) ||
          d.diagnosis.toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [allEvents, filter, searchQuery]);

  const groups = useMemo(() => groupByPeriod(filtered), [filtered]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function handlePrint() {
    window.print();
  }

  // État vide
  if (vaccinations.length === 0 && consultations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="text-muted-foreground size-7" />
          </div>
          <p className="font-medium">Aucun événement médical</p>
          <p className="text-muted-foreground mt-1 max-w-xs text-center text-sm">
            Les vaccinations et consultations apparaîtront ici une fois enregistrées par votre clinique.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filterCounts = {
    all: allEvents.length,
    vaccination: allEvents.filter((e) => e.type === "vaccination").length,
    consultation: allEvents.filter((e) => e.type === "consultation").length,
  };

  return (
    <div className="space-y-4 print:space-y-2">
      {/* ── Barre d'outils ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un vaccin, médecin, diagnostic…"
            className="h-9 pl-10 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <Filter className="text-muted-foreground ml-2 mr-1 size-3.5" />
            {(["all", "vaccination", "consultation"] as FilterMode[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Tout" : f === "vaccination" ? "Vaccins" : "Consult."}
                <span className={`ml-1 text-[10px] ${filter === f ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                  {filterCounts[f]}
                </span>
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5">
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>
      </div>

      {/* ── Chronologie ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12">
            <Search className="text-muted-foreground mb-2 size-6" />
            <p className="text-muted-foreground text-sm">Aucun événement ne correspond à votre recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 print:space-y-4">
          {groups.map((group) => (
            <div key={group.label} className="timeline-group">
              {/* Libellé de période */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  <CalendarClock className="size-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-border" />
                <span className="text-muted-foreground/60 text-[11px] tabular-nums">
                  {group.events.length}
                </span>
              </div>

              {/* Événements */}
              <div className="relative ml-[18px] border-l-2 border-border/60 pl-7 print:ml-2 print:pl-4">
                {group.events.map((event, idx) => {
                  const id =
                    event.type === "vaccination"
                      ? (event.data as VaccinationEntry).id
                      : (event.data as ConsultationEntry).id;
                  const isExpanded = expanded.has(id);
                  const isVacc = event.type === "vaccination";

                  return (
                    <div
                      key={id}
                      className={`relative pb-6 last:pb-0 print:pb-3 ${idx === 0 ? "timeline-enter" : ""}`}
                    >
                      {/* Point avec icône */}
                      <div
                        className={`absolute -left-[calc(1.75rem+5px)] top-[14px] flex size-7 items-center justify-center rounded-full border-[3px] border-background shadow-sm transition-transform ${
                          isVacc ? "bg-healthcare" : "bg-primary"
                        } ${isExpanded ? "scale-110" : ""}`}
                      >
                        {isVacc ? (
                          <Syringe className="size-3 text-white" />
                        ) : (
                          <Stethoscope className="size-3 text-white" />
                        )}
                      </div>

                      {/* Date node */}
                      <p className="text-muted-foreground mb-1.5 text-[11px] font-medium tabular-nums">
                        {formatDateFr(event.date)}
                      </p>

                      {/* Carte événement */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(id)}
                        className="group w-full text-left"
                      >
                        <div
                          className={`rounded-xl border transition-all duration-200 ${
                            isVacc
                              ? "border-healthcare/10 bg-gradient-to-r from-healthcare/[0.03] to-transparent hover:border-healthcare/25 hover:shadow-md"
                              : "border-primary/10 bg-gradient-to-r from-primary/[0.03] to-transparent hover:border-primary/25 hover:shadow-md"
                          } ${isExpanded ? (isVacc ? "border-healthcare/20 shadow-sm" : "border-primary/20 shadow-sm") : ""}`}
                        >
                          <div className="px-4 py-3">
                            {isVacc ? (
                              <VaccinationCard
                                v={event.data as VaccinationEntry}
                                isExpanded={isExpanded}
                              />
                            ) : (
                              <ConsultationCard
                                c={event.data as ConsultationEntry}
                                isExpanded={isExpanded}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Carte vaccination ────────────────────────────────────────────────────────

function VaccinationCard({ v, isExpanded }: { v: VaccinationEntry; isExpanded: boolean }) {
  const hasUpcoming = v.nextDoseDate && new Date(v.nextDoseDate) > new Date();
  const isOverdue = v.nextDoseDate && new Date(v.nextDoseDate) < new Date();

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-healthcare/20 bg-healthcare/5 text-healthcare text-[10px] font-semibold">
              Vaccination
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="gap-0.5 text-[9px]">
                <AlertTriangle className="size-2" /> Rappel en retard
              </Badge>
            )}
            {hasUpcoming && !isOverdue && (
              <Badge variant="secondary" className="gap-0.5 text-[9px]">
                <CalendarClock className="size-2" /> Prochaine : {formatDateFr(v.nextDoseDate!)}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold">{v.vaccine}</p>
          <p className="text-muted-foreground text-xs">
            {ordinalFr(v.dose)} dose · {v.clinicName}
          </p>
        </div>
        <ChevronDown
          className={`text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Détails animés */}
      <div
        className={`timeline-details overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1.5 border-t border-border/50 pt-3 text-xs">
          <DetailRow label="Clinique" value={v.clinicName} />
          {v.healthcareProfessionalName && (
            <DetailRow label="Administré par" value={v.healthcareProfessionalName} />
          )}
          {v.nextDoseDate && (
            <DetailRow label="Prochaine dose" value={formatDateFr(v.nextDoseDate)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Carte consultation ───────────────────────────────────────────────────────

function ConsultationCard({ c, isExpanded }: { c: ConsultationEntry; isExpanded: boolean }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold">
              Consultation
            </Badge>
            {c.followUpRequired && (
              <Badge variant="destructive" className="gap-0.5 text-[9px]">
                <AlertTriangle className="size-2" /> Suivi requis
              </Badge>
            )}
            {c.reasonForVisit && (
              <Badge variant="secondary" className="text-[9px]">{c.reasonForVisit}</Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold">{c.clinicianName}</p>
          <p className="text-muted-foreground text-xs line-clamp-1">
            {c.diagnosis || c.summary.slice(0, 80)}
          </p>
        </div>
        <ChevronDown
          className={`text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Détails animés */}
      <div
        className={`timeline-details overflow-hidden transition-all duration-200 ease-out ${
          isExpanded ? "mt-3 max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-1.5 border-t border-border/50 pt-3 text-xs">
          {c.diagnosis && <DetailRow label="Diagnostic" value={c.diagnosis} />}
          <DetailRow label="Résumé" value={c.summary} />
        </div>
      </div>
    </div>
  );
}

// ── Ligne de détail ──────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

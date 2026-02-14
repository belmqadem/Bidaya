"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOpenReports, type ReportListItem } from "../report-actions";

const SEVERITY_LABELS: Record<string, { label: string; class: string }> = {
  mild: { label: "Léger", class: "bg-yellow-100 text-yellow-800" },
  moderate: { label: "Modéré", class: "bg-orange-100 text-orange-800" },
  severe: { label: "Sévère", class: "bg-red-100 text-red-800" },
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  open: { label: "En attente", class: "bg-blue-100 text-blue-800" },
  replied: { label: "Répondu", class: "bg-emerald-100 text-emerald-800" },
  prescribed: { label: "Ordonnance", class: "bg-purple-100 text-purple-800" },
  closed: { label: "Fermé", class: "bg-gray-100 text-gray-800" },
};

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

  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/clinic">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">
            Signalements post-vaccination
          </h1>
          <p className="text-muted-foreground text-xs">
            {openCount} signalement{openCount !== 1 ? "s" : ""} en attente
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2.5">
        <Filter className="size-4 text-muted-foreground" />
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="open">En attente</SelectItem>
            <SelectItem value="replied">Répondu</SelectItem>
            <SelectItem value="prescribed">Ordonnance émise</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center text-sm py-12">
          Chargement…
        </p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangle className="size-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Aucun signalement{statusFilter !== "all" ? " avec ce statut" : ""}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => {
            const sev = SEVERITY_LABELS[r.severity] ?? SEVERITY_LABELS.mild;
            const stat = STATUS_LABELS[r.status] ?? STATUS_LABELS.open;

            return (
              <Link key={r.id} href={`/clinic/reports/${r.id}`}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {r.childName}
                        </p>
                        <Badge className={sev.class}>{sev.label}</Badge>
                        <Badge className={stat.class}>{stat.label}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">
                        {r.vaccineName
                          ? `${r.vaccineName} — `
                          : ""}
                        {r.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.messageCount > 0 && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <MessageSquare className="size-3" />
                          {r.messageCount}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-[11px]">
                        {r.createdAt}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

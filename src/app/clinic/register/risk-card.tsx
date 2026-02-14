"use client";

import { AlertTriangle, CheckCircle2, Info, Brain } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NeonatalRiskResult } from "@/lib/ml/neonatalRiskService";

// ── Risk badge config ───────────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW: {
    label: "Risque faible",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    barClass: "bg-emerald-500",
    borderClass: "border-l-emerald-500",
  },
  MODERATE: {
    label: "Risque modéré",
    icon: Info,
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    barClass: "bg-amber-500",
    borderClass: "border-l-amber-500",
  },
  HIGH: {
    label: "Risque élevé",
    icon: AlertTriangle,
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    barClass: "bg-red-500",
    borderClass: "border-l-red-500",
  },
} as const;

// ── Component ───────────────────────────────────────────────────────────────

interface RiskCardProps {
  result: NeonatalRiskResult;
}

export function RiskCard({ result }: RiskCardProps) {
  const cfg = RISK_CONFIG[result.riskLevel];
  const Icon = cfg.icon;

  return (
    <Card className={`border-l-4 ${cfg.borderClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Analyse IA — Risque néonatal
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk badge + weight */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.badgeClass}`}
          >
            <Icon className="size-3.5" />
            {cfg.label}
          </span>
          <span className="font-mono text-lg font-bold tabular-nums">
            {result.predictedWeight.toLocaleString("fr-FR")}&nbsp;g
          </span>
        </div>

        {/* Explanation */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          {result.explanation}
        </p>

        {/* Disclaimer */}
        <p className="text-muted-foreground/60 text-[11px] italic">
          Estimation basée sur un modèle IA. Ne remplace pas le jugement clinique.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Error state ─────────────────────────────────────────────────────────────

export function RiskCardError() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="flex items-center gap-3 py-4">
        <Info className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Analyse IA indisponible</p>
          <p className="text-muted-foreground text-xs">
            L&apos;estimation du risque n&apos;a pas pu être calculée. L&apos;inscription peut continuer normalement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Loading state ───────────────────────────────────────────────────────────

export function RiskCardLoading() {
  return (
    <Card className="border-l-4 border-l-muted animate-pulse">
      <CardContent className="flex items-center gap-3 py-4">
        <Brain className="size-4 text-muted-foreground animate-spin" />
        <p className="text-muted-foreground text-sm">
          Analyse IA en cours…
        </p>
      </CardContent>
    </Card>
  );
}

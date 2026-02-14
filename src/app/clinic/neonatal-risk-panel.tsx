"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brain, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  predictNeonatalRisk,
  type NeonatalRiskResult,
} from "@/lib/ml/neonatalRiskService";

// ── Zod schema for maternal data ─────────────────────────────────────────────
const maternalSchema = z.object({
  gestationWeeks: z.coerce
    .number()
    .min(20, "Min. 20 semaines")
    .max(45, "Max. 45 semaines"),
  parity: z.coerce.number().min(0).max(1),
  maternalAge: z.coerce.number().min(14, "Min. 14 ans").max(55, "Max. 55 ans"),
  maternalHeight: z.coerce
    .number()
    .min(120, "Min. 120 cm")
    .max(200, "Max. 200 cm"),
  maternalWeight: z.coerce
    .number()
    .min(35, "Min. 35 kg")
    .max(150, "Max. 150 kg"),
  smokingStatus: z.boolean().default(false),
});

type MaternalFormValues = z.input<typeof maternalSchema>;

// ── Risk badge config ────────────────────────────────────────────────────────
const RISK_CONFIG = {
  LOW: {
    label: "Risque faible",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    borderClass: "border-l-emerald-500",
  },
  MODERATE: {
    label: "Risque modéré",
    icon: Info,
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    borderClass: "border-l-amber-500",
  },
  HIGH: {
    label: "Risque élevé",
    icon: AlertTriangle,
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    borderClass: "border-l-red-500",
  },
} as const;

// ── Main panel component ─────────────────────────────────────────────────────
export function NeonatalRiskPanel() {
  const [result, setResult] = useState<NeonatalRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const form = useForm<MaternalFormValues>({
    resolver: zodResolver(maternalSchema),
    defaultValues: {
      gestationWeeks: undefined,
      parity: undefined,
      maternalAge: undefined,
      maternalHeight: undefined,
      maternalWeight: undefined,
      smokingStatus: false,
    },
  });

  const handleAnalyze = useCallback(async (values: MaternalFormValues) => {
    setResult(null);
    setError(false);
    setLoading(true);

    try {
      const res = await predictNeonatalRisk({
        gestationWeeks: Number(values.gestationWeeks),
        parity: Number(values.parity ?? 0),
        maternalAge: Number(values.maternalAge),
        maternalHeight: Number(values.maternalHeight),
        maternalWeight: Number(values.maternalWeight),
        smokingStatus: Boolean(values.smokingStatus),
      });
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card className="border-l-4 border-l-healthcare">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-healthcare/10">
            <Brain className="size-4 text-healthcare" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">
              Prédiction IA — Risque néonatal
            </CardTitle>
            <CardDescription className="text-xs">
              Renseignez les données maternelles pour estimer le poids de
              naissance et le niveau de risque.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAnalyze)}>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gestationWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Gestation (semaines)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="20"
                        max="45"
                        placeholder="ex : 40"
                        className="h-9 text-sm"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Parité</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value != null ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Primipare</SelectItem>
                        <SelectItem value="1">Multipare</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maternalAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Âge (ans)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="14"
                        max="55"
                        placeholder="ex : 28"
                        className="h-9 text-sm"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maternalHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Taille (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="120"
                        max="200"
                        placeholder="ex : 163"
                        className="h-9 text-sm"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maternalWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Poids (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="35"
                        max="150"
                        placeholder="ex : 65"
                        className="h-9 text-sm"
                        {...field}
                        value={field.value != null ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="smokingStatus"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value as boolean}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="mt-0! text-xs">
                    Tabagisme pendant la grossesse
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full gap-2 bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
              disabled={loading}
            >
              <Brain className="size-4" />
              {loading ? "Analyse en cours…" : "Lancer l'analyse IA"}
            </Button>

            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <Brain className="size-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Analyse IA en cours…
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <Info className="size-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Analyse IA indisponible</p>
                  <p className="text-muted-foreground text-xs">
                    L&apos;estimation du risque n&apos;a pas pu être calculée.
                    Veuillez réessayer.
                  </p>
                </div>
              </div>
            )}

            {/* Result */}
            {result && <RiskResultCard result={result} />}
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}

// ── Inline result card ───────────────────────────────────────────────────────
function RiskResultCard({ result }: { result: NeonatalRiskResult }) {
  const cfg = RISK_CONFIG[result.riskLevel];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg border-l-4 ${cfg.borderClass} border bg-background p-5 space-y-3`}
    >
      {/* Badge + Weight */}
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
    </div>
  );
}

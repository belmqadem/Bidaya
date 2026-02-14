"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Baby, Brain } from "lucide-react";
import type { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { registerChildSchema } from "@/lib/schemas/child";
import {
  predictNeonatalRisk,
  type NeonatalRiskResult,
} from "@/lib/ml/neonatalRiskService";
import { RiskCard, RiskCardError, RiskCardLoading } from "./risk-card";

// ── Types ───────────────────────────────────────────────────────────────────
type FormValues = z.input<typeof registerChildSchema>;

// ── Page component ──────────────────────────────────────────────────────────
export default function RegisterChildPage() {
  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(registerChildSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      gender: "unknown",
      birthWeight: undefined,
      deliveryType: "voie basse",
      parentName: "",
      parentContact: "",
      gestationWeeks: undefined,
      parity: undefined,
      maternalAge: undefined,
      maternalHeight: undefined,
      maternalWeight: undefined,
      smokingStatus: false,
    },
  });

  // AI risk state
  const [riskResult, setRiskResult] = useState<NeonatalRiskResult | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskError, setRiskError] = useState(false);

  // Success state (after form submit)
  const [submitted, setSubmitted] = useState(false);

  // ── AI analysis handler ─────────────────────────────────────────────────
  const analyzeRisk = useCallback(async () => {
    const vals = form.getValues();
    const {
      gestationWeeks,
      parity,
      maternalAge,
      maternalHeight,
      maternalWeight,
      smokingStatus,
    } = vals;

    if (
      !gestationWeeks ||
      maternalAge == null ||
      maternalHeight == null ||
      maternalWeight == null
    ) {
      form.setError("gestationWeeks", {
        message:
          "Remplissez tous les champs maternels pour lancer l'analyse.",
      });
      return;
    }

    setRiskResult(null);
    setRiskError(false);
    setRiskLoading(true);

    try {
      const result = await predictNeonatalRisk({
        gestationWeeks: Number(gestationWeeks),
        parity: Number(parity ?? 0),
        maternalAge: Number(maternalAge),
        maternalHeight: Number(maternalHeight),
        maternalWeight: Number(maternalWeight),
        smokingStatus: Boolean(smokingStatus),
      });
      setRiskResult(result);
    } catch {
      setRiskError(true);
    } finally {
      setRiskLoading(false);
    }
  }, [form]);

  // ── Form submit handler ─────────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    console.log("Registering child:", values);
    console.log("AI risk result:", riskResult);
    setSubmitted(true);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm border-t-4 border-t-emerald-500 shadow-lg">
          <CardHeader className="items-center text-center">
            <Baby className="size-12 text-emerald-600" />
            <CardTitle className="mt-2">Dossier créé avec succès</CardTitle>
            <CardDescription>
              Le carnet de santé numérique a été initialisé.
              {riskResult && (
                <span className="mt-2 block">
                  Risque néonatal IA&nbsp;:{" "}
                  <strong>{riskResult.riskLevel}</strong> (
                  {riskResult.predictedWeight}g)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setSubmitted(false);
                setRiskResult(null);
                setRiskError(false);
                form.reset();
              }}
            >
              Créer un autre dossier
            </Button>
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-center text-sm underline transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl p-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <CardTitle>Nouveau dossier de santé</CardTitle>
              <CardDescription>
                Créez un carnet de santé numérique vérifié pour le nouveau-né.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* ── Section: Enfant ─────────────────────────────────── */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informations de l&apos;enfant
                </h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ex : Youssef Amrani"
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
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de naissance</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexe</FormLabel>
                          <FormControl>
                            <select
                              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                              {...field}
                            >
                              <option value="unknown">Inconnu</option>
                              <option value="male">Masculin</option>
                              <option value="female">Féminin</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids de naissance (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="10"
                              placeholder="ex : 3.2"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deliveryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type d&apos;accouchement</FormLabel>
                          <FormControl>
                            <select
                              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                              {...field}
                            >
                              <option value="voie basse">Voie basse</option>
                              <option value="cesarean">Césarienne</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* ── Section: Parent ─────────────────────────────────── */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Informations du parent
                </h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du parent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ex : Fatima Amrani"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parentContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact du parent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ex : +212 600 000 000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section: Données maternelles (AI) ──────────────── */}
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Données maternelles — Analyse IA
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Ces champs alimentent le modèle de prédiction du risque
                  néonatal. Ils sont facultatifs.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gestationWeeks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Durée de gestation (semaines)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="20"
                              max="45"
                              placeholder="ex : 40"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
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
                          <FormLabel>Parité</FormLabel>
                          <FormControl>
                            <select
                              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
                            >
                              <option value="">Sélectionner</option>
                              <option value="0">Première grossesse</option>
                              <option value="1">Multipare</option>
                            </select>
                          </FormControl>
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
                          <FormLabel>Âge maternel (ans)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="14"
                              max="55"
                              placeholder="ex : 28"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
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
                          <FormLabel>Taille (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="120"
                              max="200"
                              placeholder="ex : 163"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
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
                          <FormLabel>Poids (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="35"
                              max="150"
                              placeholder="ex : 65"
                              {...field}
                              value={
                                field.value != null ? String(field.value) : ""
                              }
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
                          <input
                            type="checkbox"
                            className="size-4 rounded border-input"
                            checked={field.value as boolean}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mt-0! text-sm">
                          La mère fume pendant la grossesse
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {/* AI Analyze button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={analyzeRisk}
                    disabled={riskLoading}
                  >
                    <Brain className="size-4" />
                    {riskLoading
                      ? "Analyse en cours…"
                      : "Analyser le risque néonatal"}
                  </Button>

                  {/* AI Result */}
                  {riskLoading && <RiskCardLoading />}
                  {riskError && <RiskCardError />}
                  {riskResult && <RiskCard result={riskResult} />}
                </div>
              </div>
            </CardContent>

            {/* ── Submit ──────────────────────────────────────────── */}
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Création du dossier…"
                  : "Créer le dossier"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

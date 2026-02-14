"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Copy } from "lucide-react";
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
  registerChildSchema,
  type RegisterChildInput,
} from "@/lib/schemas/child";
import { registerChild } from "./actions";
import type { z } from "zod";

type RegisterFormValues = z.input<typeof registerChildSchema>;

export default function RegisterChildPage() {
  const [result, setResult] = useState<{
    success: boolean;
    identifier?: string;
    error?: string;
  } | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerChildSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      gender: "unknown",
      birthWeight: undefined,
      birthLength: undefined,
      headCircumferenceAtBirth: undefined,
      placeOfBirth: "",
      deliveryType: "voie basse",
      parentName: "",
      parentContact: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setResult(null);
    const res = await registerChild(values as RegisterChildInput);
    setResult(res);
    if (res.success) {
      form.reset();
    }
  }

  // ── État de succès ──────────────────────────────────────────────────────
  if (result?.success && result.identifier) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm border-t-4 border-t-healthcare shadow-lg">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="size-12 text-healthcare" />
            <CardTitle className="mt-2">Dossier créé avec succès</CardTitle>
            <CardDescription>
              Voici l&apos;identifiant unique de l&apos;enfant. Remettez-le au parent — c&apos;est sa clé d&apos;accès au carnet de santé numérique.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
              <span className="font-mono text-lg font-bold tracking-wider">
                {result.identifier}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  navigator.clipboard.writeText(result.identifier!)
                }
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
              onClick={() => setResult(null)}
            >
              Créer un autre dossier
            </Button>
            <Link
              href="/clinic"
              className="text-muted-foreground hover:text-foreground text-center text-sm underline transition-colors"
            >
              Retour au tableau de bord
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── État du formulaire ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-t-4 border-t-healthcare shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link href="/clinic">
              <Button variant="ghost" size="icon-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <CardTitle>Nouveau dossier de santé</CardTitle>
              <CardDescription>
                Créez un carnet de santé numérique vérifié. Un identifiant unique sera généré automatiquement.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet de l&apos;enfant</FormLabel>
                    <FormControl>
                      <Input placeholder="ex : Youssef Amrani" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculin</SelectItem>
                          <SelectItem value="female">Féminin</SelectItem>
                          <SelectItem value="unknown">Inconnu</SelectItem>
                        </SelectContent>
                      </Select>
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
                          value={field.value != null ? String(field.value) : ""}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voie basse">Voie Basse</SelectItem>
                          <SelectItem value="cesarean">Césarienne</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille à la naissance (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="10"
                          max="70"
                          placeholder="ex : 50"
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
                  name="headCircumferenceAtBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Périmètre crânien (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="15"
                          max="50"
                          placeholder="ex : 35"
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
                name="placeOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de naissance</FormLabel>
                    <FormControl>
                      <Input placeholder="ex : CHU Ibn Rochd, Casablanca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du parent</FormLabel>
                    <FormControl>
                      <Input placeholder="ex : Fatima Amrani" {...field} />
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
              {result?.error && (
                <p className="text-destructive text-sm">{result.error}</p>
              )}
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
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

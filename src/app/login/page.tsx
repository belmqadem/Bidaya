"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().min(1, "L'e-mail est requis").email("E-mail invalide"),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "clinic";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: values.email.trim(),
        role,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      form.setError("root", { message: data.error ?? "Échec de connexion" });
      return;
    }
    const data = await res.json();
    router.push(data.redirect);
  }

  const roleLabel = role === "clinic" ? "Personnel médical" : "Parent / Tuteur";

  return (
    <div className="relative flex min-h-screen">
      {/* Image de fond */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/image.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Carte centrée */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-healthcare text-healthcare-foreground shadow-md">
            <Stethoscope className="size-7" aria-hidden />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Espace Clinique
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gérez les dossiers de santé numériques vérifiés par votre établissement
            </p>
          </div>
        </div>

        {/* Carte */}
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Connexion — {roleLabel}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Identifiez-vous pour accéder aux dossiers et enregistrer les actes médicaux.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="vous@exemple.com"
                        autoComplete="email"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              href="/select-role"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              &larr; Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

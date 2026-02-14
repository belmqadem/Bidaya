"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Stethoscope, ShieldCheck, KeyRound } from "lucide-react";
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

// ── Schémas Zod ──────────────────────────────────────────────────────────────

const identifySchema = z.object({
  identifier: z.string().min(1, "L'identifiant est requis"),
  phone: z.string().min(5, "Numéro de téléphone invalide"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Le code doit contenir 6 chiffres"),
});

type IdentifyValues = z.infer<typeof identifySchema>;
type OtpValues = z.infer<typeof otpSchema>;
type Step = "identify" | "otp";

// ── Composant principal ──────────────────────────────────────────────────────

export default function ParentLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [otpHint, setOtpHint] = useState("");
  const [serverError, setServerError] = useState("");

  // Conserver identifiant + phone entre les étapes
  const [savedIdentifier, setSavedIdentifier] = useState("");
  const [savedPhone, setSavedPhone] = useState("");

  const identifyForm = useForm<IdentifyValues>({
    resolver: zodResolver(identifySchema),
    defaultValues: { identifier: "", phone: "" },
  });

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onIdentifySubmit(values: IdentifyValues) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/parent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: values.identifier.trim(),
          phone: values.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Échec de la vérification.");
        return;
      }
      setSavedIdentifier(values.identifier.trim());
      setSavedPhone(values.phone.trim());
      setOtpHint(data.otp ?? "");
      setStep("otp");
    } catch {
      setServerError("Erreur réseau. Veuillez réessayer.");
    }
  }

  async function onOtpSubmit(values: OtpValues) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/parent/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: savedIdentifier,
          phone: savedPhone,
          otp: values.otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Échec de la vérification.");
        return;
      }
      router.push(data.redirect);
    } catch {
      setServerError("Erreur réseau. Veuillez réessayer.");
    }
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Fond */}
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

      {/* Contenu centré */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-healthcare text-healthcare-foreground shadow-md">
            <Stethoscope className="size-7" aria-hidden />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Espace Parent</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Accédez au carnet de santé numérique de votre enfant à l&apos;aide de son identifiant unique
            </p>
          </div>
        </div>

        {/* Carte */}
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl">
          {step === "identify" ? (
            <>
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="size-5 text-healthcare" />
                  Identification
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Saisissez l&apos;identifiant unique de votre enfant (remis par la clinique) et votre numéro de téléphone.
                </p>
              </div>

              <Form {...identifyForm}>
                <form onSubmit={identifyForm.handleSubmit(onIdentifySubmit)} className="space-y-5">
                  <FormField
                    control={identifyForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifiant unique de l&apos;enfant</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="CHR-XXXX-XXXX"
                            className="h-11 font-mono tracking-wider uppercase"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={identifyForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+212 600 000 000"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {serverError && (
                    <p className="text-destructive text-sm">{serverError}</p>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                    disabled={identifyForm.formState.isSubmitting}
                  >
                    {identifyForm.formState.isSubmitting ? "Vérification…" : "Recevoir le code de vérification"}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/select-role"
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      &larr; Retour à l&apos;accueil
                    </Link>
                  </div>
                </form>
              </Form>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound className="size-5 text-healthcare" />
                  Code de vérification
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Un code à 6 chiffres a été envoyé au numéro associé au dossier.
                </p>
              </div>

              {otpHint && (
                <div className="mb-5 rounded-xl border border-dashed border-healthcare/30 bg-healthcare/5 px-4 py-3 text-center">
                  <span className="text-muted-foreground text-xs">Code démo MVP</span>
                  <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.3em]">
                    {otpHint}
                  </p>
                </div>
              )}

              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code de vérification</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            className="h-12 text-center font-mono text-xl tracking-[0.5em]"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {serverError && (
                    <p className="text-destructive text-sm">{serverError}</p>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                    disabled={otpForm.formState.isSubmitting}
                  >
                    {otpForm.formState.isSubmitting ? "Vérification…" : "Consulter le carnet de santé"}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("identify");
                        otpForm.reset();
                        setOtpHint("");
                        setServerError("");
                      }}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      &larr; Retour
                    </button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

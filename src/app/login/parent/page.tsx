"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "identify" | "otp";

export default function ParentLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/parent/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la vérification.");
        return;
      }
      setOtpHint(data.otp ?? "");
      setStep("otp");
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/parent/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          phone: phone.trim(),
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la vérification.");
        return;
      }
      router.push(data.redirect);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold tracking-tight">Accès Parent</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Consultez le dossier de santé de votre enfant en toute sécurité
            </p>
          </div>
        </div>

        {/* Carte */}
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-xl">
          {step === "identify" ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShieldCheck className="size-5 text-healthcare" />
                  Vérifier l&apos;identité
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Entrez l&apos;identifiant de votre enfant et votre numéro de téléphone.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier">Identifiant enfant</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="CHR-XXXX-XXXX"
                  className="h-11 font-mono tracking-wider uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 600 000 000"
                  className="h-11"
                  required
                />
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                disabled={loading || !identifier.trim() || !phone.trim()}
              >
                {loading ? "Vérification…" : "Envoyer le code"}
              </Button>

              <div className="text-center">
                <Link
                  href="/select-role"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  &larr; Changer de rôle
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <KeyRound className="size-5 text-healthcare" />
                  Entrer le code de vérification
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Un code à 6 chiffres a été envoyé sur votre téléphone.
                </p>
              </div>

              {otpHint && (
                <div className="rounded-xl border border-dashed border-healthcare/30 bg-healthcare/5 px-4 py-3 text-center">
                  <span className="text-muted-foreground text-xs">Code démo MVP</span>
                  <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.3em]">
                    {otpHint}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Code de vérification</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 text-center font-mono text-xl tracking-[0.5em]"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}

              <Button
                type="submit"
                className="h-11 w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                disabled={loading || otp.trim().length < 6}
              >
                {loading ? "Vérification…" : "Accéder au tableau de bord"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identify");
                    setOtp("");
                    setOtpHint("");
                    setError("");
                  }}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  &larr; Retour
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

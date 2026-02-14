"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stethoscope, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
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

  // ── Step 1: Verify child + phone ──────────────────────────────────────────
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
        setError(data.error ?? "Verification failed.");
        return;
      }
      // MVP: show the OTP hint
      setOtpHint(data.otp ?? "");
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Submit OTP ────────────────────────────────────────────────────
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
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push(data.redirect);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/image.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/select-role"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <span className="text-sm font-medium">Child health record</span>
        <div className="w-16" />
      </nav>

      {/* Card */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-healthcare text-healthcare-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Parent access
          </span>
        </div>

        <Card className="w-full max-w-sm border-t-4 border-t-healthcare shadow-lg">
          {step === "identify" ? (
            <form onSubmit={handleVerify}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  Verify identity
                </CardTitle>
                <CardDescription>
                  Enter your child&apos;s identifier and your phone number to
                  receive a verification code.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Child identifier</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="CHR-XXXX-XXXX"
                    className="font-mono tracking-wider uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 600 000 000"
                    required
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                  disabled={loading || !identifier.trim() || !phone.trim()}
                >
                  {loading ? "Verifying…" : "Send verification code"}
                </Button>
                <Link
                  href="/select-role"
                  className="text-muted-foreground text-center text-xs underline transition-colors hover:text-foreground"
                >
                  Switch role
                </Link>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleOtp}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="size-5" />
                  Enter verification code
                </CardTitle>
                <CardDescription>
                  A 6-digit code was sent to your phone number.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {otpHint && (
                  <div className="rounded-md border border-dashed border-healthcare/40 bg-healthcare/5 px-3 py-2 text-center text-sm">
                    <span className="text-muted-foreground">MVP code: </span>
                    <span className="font-mono text-base font-semibold tracking-widest">
                      {otpHint}
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-[0.5em]"
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                  disabled={loading || otp.trim().length < 6}
                >
                  {loading ? "Verifying…" : "Access dashboard"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("identify");
                    setOtp("");
                    setOtpHint("");
                    setError("");
                  }}
                  className="text-muted-foreground text-center text-xs underline transition-colors hover:text-foreground"
                >
                  Go back
                </button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

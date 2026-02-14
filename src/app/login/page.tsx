"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Heart, Stethoscope } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const navLinks = [
  { href: "#docs", label: "Docs", icon: FileText },
  { href: "#vaccination", label: "Vaccination info", icon: Stethoscope },
  { href: "#health", label: "Health records", icon: Heart },
];

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
      form.setError("root", { message: data.error ?? "Login failed" });
      return;
    }
    const data = await res.json();
    router.push(data.redirect);
  }

  const roleLabel = role === "clinic" ? "Clinic staff" : "Parent";

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background image */}
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
        <Link href="/select-role" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
          Child health record
        </Link>
        <ul className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo + card */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-healthcare text-healthcare-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Child health record
          </span>
        </div>
        <Card className="w-full max-w-sm border-t-4 border-t-healthcare shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle>Sign in as {roleLabel}</CardTitle>
            <CardDescription>
              Enter your email to access vaccination and consultation records.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
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
                      <FormLabel>Password (optional for MVP)</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
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
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
                <Link
                  href="/select-role"
                  className="text-muted-foreground hover:text-foreground text-center text-xs underline transition-colors"
                >
                  Switch role
                </Link>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

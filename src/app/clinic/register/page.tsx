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

export default function RegisterChildPage() {
  const [result, setResult] = useState<{
    success: boolean;
    identifier?: string;
    error?: string;
  } | null>(null);

  const form = useForm<RegisterChildInput>({
    resolver: zodResolver(registerChildSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      parentName: "",
      parentContact: "",
    },
  });

  async function onSubmit(values: RegisterChildInput) {
    setResult(null);
    const res = await registerChild(values);
    setResult(res);
    if (res.success) {
      form.reset();
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (result?.success && result.identifier) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-sm border-t-4 border-t-healthcare shadow-lg">
          <CardHeader className="items-center text-center">
            <CheckCircle2 className="size-12 text-healthcare" />
            <CardTitle className="mt-2">Child registered</CardTitle>
            <CardDescription>
              Save the identifier below. It is used to look up this child&apos;s
              record.
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
              Register another child
            </Button>
            <Link
              href="/clinic"
              className="text-muted-foreground hover:text-foreground text-center text-sm underline transition-colors"
            >
              Back to dashboard
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────
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
              <CardTitle>Register a child</CardTitle>
              <CardDescription>
                Fill in the details to create a new child health record.
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
                    <FormLabel>Child full name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Youssef Amrani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Parent name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Fatima Amrani" {...field} />
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
                    <FormLabel>Parent contact</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. +212 600 000 000"
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
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Registering…"
                  : "Register child"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createReport,
  getMyVaccinations,
  type VaccinationOption,
} from "../../report-actions";

export default function NewReportPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vaccinations, setVaccinations] = useState<VaccinationOption[]>([]);
  const [vaccinationId, setVaccinationId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [error, setError] = useState("");

  useEffect(() => {
    getMyVaccinations().then(setVaccinations);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createReport({
        vaccinationId: vaccinationId || undefined,
        description,
        severity,
      });

      if (result.success && result.reportId) {
        router.push(`/parent/report/${result.reportId}`);
      } else {
        setError(result.success ? "" : result.error);
      }
    });
  }

  return (
    <Card className="border-t-4 border-t-amber-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Link href="/parent">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Signaler un effet indésirable
            </CardTitle>
            <CardDescription className="mt-1">
              Décrivez les symptômes observés après la vaccination. Le médecin
              sera notifié et pourra vous répondre.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-0">
          {vaccinations.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Vaccination concernée
            </label>
              <Select onValueChange={setVaccinationId} value={vaccinationId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une vaccination (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {vaccinations.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sévérité des symptômes
            </label>
            <Select onValueChange={setSeverity} value={severity}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Léger</SelectItem>
                <SelectItem value="moderate">Modéré</SelectItem>
                <SelectItem value="severe">Sévère</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description des symptômes *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les symptômes observés : fièvre, rougeur, gonflement, pleurs inhabituels…"
              rows={5}
              required
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
            disabled={isPending || !description.trim()}
          >
            {isPending ? "Envoi en cours…" : "Envoyer le signalement"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

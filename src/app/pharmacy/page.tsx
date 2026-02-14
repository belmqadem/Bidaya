"use client";

import { useState, useTransition } from "react";
import {
  Search,
  FileText,
  Check,
  AlertTriangle,
  Pill,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  lookupPrescription,
  markDispensed,
  type PrescriptionDetail,
} from "./actions";

export default function PharmacyDashboard() {
  const [code, setCode] = useState("");
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(
    null,
  );
  const [error, setError] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [isSearching, startSearch] = useTransition();
  const [isDispensing, startDispense] = useTransition();
  const [dispenseSuccess, setDispenseSuccess] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPrescription(null);
    setDispenseSuccess(false);

    startSearch(async () => {
      const result = await lookupPrescription(code);
      if (result.found) {
        setPrescription(result.prescription);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDispense() {
    if (!pharmacyName.trim()) {
      setError("Veuillez entrer le nom de votre pharmacie.");
      return;
    }
    setError("");

    startDispense(async () => {
      const result = await markDispensed(code, pharmacyName);
      if (result.success) {
        setDispenseSuccess(true);
        // Refresh prescription data
        const updated = await lookupPrescription(code);
        if (updated.found) {
          setPrescription(updated.prescription);
        }
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-linear-to-br from-emerald-600/8 via-emerald-600/4 to-transparent px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Pill className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Espace Pharmacie
            </h1>
            <p className="text-muted-foreground text-sm">
              Vérifiez et dispensez les ordonnances numériques émises par les
              cliniques Bidaya.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Rechercher une ordonnance
          </CardTitle>
          <CardDescription>
            Entrez le code d&apos;ordonnance communiqué par le parent (format
            ORD-XXXX-XXXX)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ORD-XXXX-XXXX"
              className="flex-1 font-mono tracking-wider uppercase"
              maxLength={13}
            />
            <Button
              type="submit"
              disabled={isSearching || !code.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isSearching ? "Recherche…" : "Vérifier"}
            </Button>
          </form>
          {error && !prescription && (
            <div className="mt-3 flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription result */}
      {prescription && (
        <Card
          className={`border-l-4 ${
            prescription.status === "dispensed"
              ? "border-l-emerald-500"
              : "border-l-purple-500"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-purple-600" />
                Ordonnance — {prescription.code}
              </CardTitle>
              <Badge
                className={
                  prescription.status === "active"
                    ? "bg-blue-100 text-blue-800"
                    : prescription.status === "dispensed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                }
              >
                {prescription.status === "active"
                  ? "Active"
                  : prescription.status === "dispensed"
                    ? "Dispensée"
                    : "Expirée"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Patient info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
              <div>
                <p className="text-muted-foreground text-xs">Patient</p>
                <p className="text-sm font-medium">{prescription.childName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Identifiant</p>
                <p className="text-sm font-mono">{prescription.childIdentifier}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Prescripteur</p>
                <p className="text-sm font-medium">
                  Dr. {prescription.doctorName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="text-sm">{prescription.createdAt}</p>
              </div>
            </div>

            {/* Medications */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-1.5">Médicaments</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {prescription.medications}
              </p>
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-1.5">Posologie</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {prescription.instructions}
              </p>
            </div>

            {prescription.notes && (
              <p className="text-muted-foreground text-xs italic">
                Note : {prescription.notes}
              </p>
            )}

            {/* Dispensed info */}
            {prescription.status === "dispensed" && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800">
                <CheckCircle2 className="size-4" />
                <p className="text-sm">
                  Dispensée par <strong>{prescription.dispensedBy}</strong> le{" "}
                  {prescription.dispensedAt}
                </p>
              </div>
            )}
          </CardContent>

          {/* Dispense action */}
          {prescription.status === "active" && (
            <CardFooter className="flex-col gap-3 border-t pt-5">
              {dispenseSuccess ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <CheckCircle2 className="size-5" />
                  <p className="text-sm font-medium">
                    Ordonnance marquée comme dispensée.
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-full space-y-2">
                    <label className="text-sm font-medium">
                      Nom de la pharmacie *
                    </label>
                    <Input
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="Pharmacie…"
                    />
                  </div>
                  {error && (
                    <p className="text-destructive text-sm w-full">{error}</p>
                  )}
                  <Button
                    onClick={handleDispense}
                    disabled={isDispensing || !pharmacyName.trim()}
                    className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Check className="size-4" />
                    {isDispensing
                      ? "Traitement…"
                      : "Marquer comme dispensée"}
                  </Button>
                </>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

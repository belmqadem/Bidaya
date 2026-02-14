"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Send,
  User,
  Stethoscope,
  FileText,
  Copy,
  Check,
  PlusCircle,
  XCircle,
  Pill,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClinicReport,
  addClinicMessage,
  createPrescription,
  closeReport,
  type ClinicReportDetail,
} from "../../report-actions";

const SEVERITY_LABELS: Record<string, { label: string; class: string }> = {
  mild: { label: "Léger", class: "bg-yellow-100 text-yellow-800" },
  moderate: { label: "Modéré", class: "bg-orange-100 text-orange-800" },
  severe: { label: "Sévère", class: "bg-red-100 text-red-800" },
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  open: { label: "En attente", class: "bg-blue-100 text-blue-800" },
  replied: { label: "Répondu", class: "bg-emerald-100 text-emerald-800" },
  prescribed: { label: "Ordonnance émise", class: "bg-purple-100 text-purple-800" },
  closed: { label: "Fermé", class: "bg-gray-100 text-gray-800" },
};

export default function ClinicReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<ClinicReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, startSending] = useTransition();
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxForm, setRxForm] = useState({
    doctorName: "",
    medications: "",
    instructions: "",
    notes: "",
  });
  const [rxPending, startRx] = useTransition();
  const [rxError, setRxError] = useState("");
  const [isClosing, startClosing] = useTransition();
  const [copied, setCopied] = useState(false);

  function loadReport() {
    getClinicReport(reportId).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadReport();
    const interval = setInterval(loadReport, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    startSending(async () => {
      const result = await addClinicMessage(reportId, message);
      if (result.success) {
        setMessage("");
        loadReport();
      }
    });
  }

  function handleCreatePrescription(e: React.FormEvent) {
    e.preventDefault();
    setRxError("");

    startRx(async () => {
      const result = await createPrescription({
        reportId,
        ...rxForm,
      });
      if (result.success) {
        setShowRxForm(false);
        setRxForm({ doctorName: "", medications: "", instructions: "", notes: "" });
        loadReport();
      } else {
        setRxError(result.error);
      }
    });
  }

  function handleClose() {
    startClosing(async () => {
      await closeReport(reportId);
      loadReport();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Chargement…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <AlertTriangle className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Signalement introuvable.
        </p>
        <Link href="/clinic/reports">
          <Button variant="outline" size="sm">Retour</Button>
        </Link>
      </div>
    );
  }

  const sev = SEVERITY_LABELS[report.severity] ?? SEVERITY_LABELS.mild;
  const stat = STATUS_LABELS[report.status] ?? STATUS_LABELS.open;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clinic/reports">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold">{report.childName}</h1>
          <p className="text-muted-foreground text-xs">
            {report.childIdentifier} ·{" "}
            {report.vaccineName
              ? `${report.vaccineName} — ${report.vaccineDate}`
              : "Vaccination non précisée"}{" "}
            · {report.createdAt}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={sev.class}>{sev.label}</Badge>
          <Badge className={stat.class}>{stat.label}</Badge>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-sm leading-relaxed">{report.description}</p>
          {report.imageUrl && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ImageIcon className="size-3.5" />
                Photo jointe par le parent
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.imageUrl}
                alt="Photo des symptômes"
                className="w-full rounded-lg border object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing prescription */}
      {report.prescription && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-purple-600" />
              Ordonnance — {report.prescription.code}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className="text-xs text-muted-foreground">
              Dr. {report.prescription.doctorName} · {report.prescription.createdAt}
            </p>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium mb-1">Médicaments</p>
              <p className="text-sm whitespace-pre-wrap">{report.prescription.medications}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium mb-1">Posologie</p>
              <p className="text-sm whitespace-pre-wrap">{report.prescription.instructions}</p>
            </div>
            {report.prescription.notes && (
              <p className="text-muted-foreground text-xs italic">
                {report.prescription.notes}
              </p>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2.5">
              <span className="font-mono text-sm font-bold tracking-wider text-purple-700">
                {report.prescription.code}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  navigator.clipboard.writeText(report.prescription!.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-purple-500" />}
              </Button>
            </div>
            {report.prescription.status === "dispensed" && (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-800">Dispensée</Badge>
                {report.prescription.dispensedBy && (
                  <span className="text-muted-foreground text-xs">
                    par {report.prescription.dispensedBy} le {report.prescription.dispensedAt}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Échanges avec le parent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {report.messages.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              Aucun message échangé.
            </p>
          )}
          {report.messages.map((msg) => {
            const isParent = msg.senderRole === "parent";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isParent ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    isParent
                      ? "bg-healthcare/10 text-healthcare"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {isParent ? (
                    <User className="size-3.5" />
                  ) : (
                    <Stethoscope className="size-3.5" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                    isParent ? "bg-muted" : "bg-healthcare/10 text-right"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className="text-muted-foreground mt-1 text-[10px]">
                    {new Date(msg.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Send message */}
          {report.status !== "closed" && (
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Répondre au parent…"
                rows={2}
                className="flex-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSending || !message.trim()}
                className="self-end bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
              >
                <Send className="size-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {report.status !== "closed" && (
        <div className="flex gap-3">
          {!report.prescription && !showRxForm && (
            <Button
              onClick={() => setShowRxForm(true)}
              className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700"
            >
              <PlusCircle className="size-4" />
              Créer une ordonnance
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isClosing}
            className="gap-1.5"
          >
            <XCircle className="size-4" />
            {isClosing ? "Fermeture…" : "Fermer le signalement"}
          </Button>
        </div>
      )}

      {/* Prescription creation form */}
      {showRxForm && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Pill className="size-4 text-purple-600" />
              Nouvelle ordonnance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nom du médecin *</label>
                <Input
                  value={rxForm.doctorName}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, doctorName: e.target.value }))
                  }
                  placeholder="Dr. …"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Médicaments *</label>
                <Textarea
                  value={rxForm.medications}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, medications: e.target.value }))
                  }
                  placeholder="Liste des médicaments prescrits"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Posologie / Instructions *
                </label>
                <Textarea
                  value={rxForm.instructions}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, instructions: e.target.value }))
                  }
                  placeholder="Posologie et instructions de prise"
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes (optionnel)</label>
                <Input
                  value={rxForm.notes}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Remarques supplémentaires"
                />
              </div>
              {rxError && (
                <p className="text-destructive text-sm">{rxError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={rxPending}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  {rxPending ? "Création…" : "Émettre l'ordonnance"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRxForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

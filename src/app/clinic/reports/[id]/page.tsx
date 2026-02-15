"use client";

import { useEffect, useState, useTransition, useRef } from "react";
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
  Clock,
  CheckCircle2,
  Calendar,
  Baby,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getClinicReport,
  addClinicMessage,
  createPrescription,
  closeReport,
  type ClinicReportDetail,
} from "../../report-actions";

/* ── Labels ───────────────────────────────────────────────────────────────── */

const SEVERITY: Record<
  string,
  { label: string; dot: string; bg: string; headerBg: string }
> = {
  mild: {
    label: "Léger",
    dot: "bg-yellow-400",
    bg: "bg-yellow-50 text-yellow-700",
    headerBg: "from-yellow-50 to-transparent border-yellow-200/60",
  },
  moderate: {
    label: "Modéré",
    dot: "bg-orange-400",
    bg: "bg-orange-50 text-orange-700",
    headerBg: "from-orange-50 to-transparent border-orange-200/60",
  },
  severe: {
    label: "Sévère",
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700",
    headerBg: "from-red-50/80 to-transparent border-red-200/60",
  },
};

const STATUS: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
  }
> = {
  open: { label: "En attente", icon: Clock, bg: "bg-blue-50 text-blue-700" },
  replied: {
    label: "Répondu",
    icon: CheckCircle2,
    bg: "bg-emerald-50 text-emerald-700",
  },
  prescribed: {
    label: "Ordonnance émise",
    icon: FileText,
    bg: "bg-purple-50 text-purple-700",
  },
  closed: {
    label: "Fermé",
    icon: XCircle,
    bg: "bg-gray-100 text-gray-600",
  },
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [report?.messages.length]);

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
        setRxForm({
          doctorName: "",
          medications: "",
          instructions: "",
          notes: "",
        });
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

  /* ── Loading / Error states ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-healthcare" />
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
          <Button variant="outline" size="sm">
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  const sev = SEVERITY[report.severity] ?? SEVERITY.mild;
  const stat = STATUS[report.status] ?? STATUS.open;
  const StatIcon = stat.icon;

  return (
    <div className="space-y-5">
      {/* ── Back ──────────────────────────────────────────────────────── */}
      <Link
        href="/clinic/reports"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Retour aux signalements
      </Link>

      {/* ── Report header card ────────────────────────────────────────── */}
      <Card
        className={`overflow-hidden border bg-linear-to-br ${sev.headerBg}`}
      >
        <CardContent className="py-5 px-5 space-y-4">
          {/* Child + Meta */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm">
                <Baby className="size-5 text-healthcare" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">
                  {report.childName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Hash className="size-3" />
                    {report.childIdentifier}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="size-3" />
                    {report.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`gap-1 text-[10px] px-2.5 py-1 ${sev.bg} border-0`}
            >
              <span
                className={`inline-block size-1.5 rounded-full ${sev.dot}`}
              />
              {sev.label}
            </Badge>
            <Badge
              variant="secondary"
              className={`gap-1 text-[10px] px-2.5 py-1 ${stat.bg} border-0`}
            >
              <StatIcon className="size-3" />
              {stat.label}
            </Badge>
            {report.vaccineName && (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] px-2.5 py-1 border-0"
              >
                <Pill className="size-3" />
                {report.vaccineName}
                {report.vaccineDate ? ` — ${report.vaccineDate}` : ""}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="rounded-lg bg-background/60 backdrop-blur-sm p-3.5">
            <p className="text-sm leading-relaxed">{report.description}</p>
          </div>

          {/* Image */}
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
                className="w-full max-h-72 rounded-lg border object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Prescription (existing) ───────────────────────────────────── */}
      {report.prescription && (
        <PrescriptionCard
          prescription={report.prescription}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(report.prescription!.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />
      )}

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-1 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
            <Stethoscope className="size-3.5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">Échanges avec le parent</p>
          {report.messages.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {report.messages.length}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="py-4 px-4 space-y-0">
            {report.messages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted/60">
                  <Send className="size-4 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Aucun message échangé. Envoyez le premier message.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {report.messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Reply form */}
            {report.status !== "closed" && (
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 pt-3 border-t"
              >
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Répondre au parent…"
                  rows={2}
                  className="flex-1 text-sm resize-none"
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
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {report.status !== "closed" && (
        <div className="flex flex-wrap gap-2.5">
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

      {/* ── Prescription form ─────────────────────────────────────────── */}
      {showRxForm && (
        <Card className="border-l-4 border-l-purple-500 overflow-hidden">
          <CardContent className="py-5 px-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-50">
                <Pill className="size-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nouvelle ordonnance</p>
                <p className="text-muted-foreground text-[11px]">
                  L&apos;ordonnance sera envoyée au parent avec un code unique
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreatePrescription}
              className="space-y-3.5 pt-1"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Nom du médecin *
                </label>
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
                <label className="text-xs font-medium">Médicaments *</label>
                <Textarea
                  value={rxForm.medications}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, medications: e.target.value }))
                  }
                  placeholder="Liste des médicaments prescrits"
                  rows={3}
                  required
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
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
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">
                  Notes (optionnel)
                </label>
                <Input
                  value={rxForm.notes}
                  onChange={(e) =>
                    setRxForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Remarques supplémentaires"
                />
              </div>
              {rxError && (
                <p className="text-destructive text-xs">{rxError}</p>
              )}
              <div className="flex gap-2.5 pt-1">
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

/* ── Message bubble ───────────────────────────────────────────────────────── */

function MessageBubble({
  msg,
}: {
  msg: { id: string; senderRole: string; content: string; createdAt: string };
}) {
  const isParent = msg.senderRole === "parent";

  return (
    <div className={`flex gap-2.5 ${isParent ? "" : "flex-row-reverse"}`}>
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
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isParent ? "bg-muted rounded-tl-sm" : "bg-healthcare/10 rounded-tr-sm"
        }`}
      >
        <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
          {isParent ? "Parent" : "Médecin"}
        </p>
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <p className="text-muted-foreground/70 mt-1.5 text-[10px]">
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
}

/* ── Prescription card ────────────────────────────────────────────────────── */

function PrescriptionCard({
  prescription: rx,
  copied,
  onCopy,
}: {
  prescription: NonNullable<ClinicReportDetail["prescription"]>;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Card className="border-l-4 border-l-purple-500 overflow-hidden">
      <CardContent className="py-5 px-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-50">
              <FileText className="size-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ordonnance numérique</p>
              <p className="text-muted-foreground text-[11px]">
                Dr. {rx.doctorName} · {rx.createdAt}
              </p>
            </div>
          </div>
          {rx.status === "dispensed" && (
            <Badge className="bg-emerald-50 text-emerald-700 border-0 gap-1 text-[10px]">
              <CheckCircle2 className="size-3" />
              Dispensée
            </Badge>
          )}
        </div>

        {/* Medications + Instructions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Médicaments
            </p>
            <p className="text-sm whitespace-pre-wrap">{rx.medications}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Posologie
            </p>
            <p className="text-sm whitespace-pre-wrap">{rx.instructions}</p>
          </div>
        </div>

        {rx.notes && (
          <p className="text-muted-foreground text-xs italic">{rx.notes}</p>
        )}

        {/* Code */}
        <div className="flex items-center gap-3 rounded-lg bg-purple-50/70 px-4 py-3">
          <span className="font-mono text-sm font-bold tracking-widest text-purple-700">
            {rx.code}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCopy}
            className="hover:bg-purple-100"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5 text-purple-500" />
            )}
          </Button>
          <span className="text-muted-foreground text-[11px]">
            Code à communiquer au parent
          </span>
        </div>

        {rx.status === "dispensed" && rx.dispensedBy && (
          <p className="text-muted-foreground text-xs">
            Dispensée par {rx.dispensedBy} le {rx.dispensedAt}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Mic, Square, Loader2, RotateCcw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVoiceRecorder } from "./useVoiceRecorder";
import type { StructuredConsultation } from "./voice.types";
import { MAX_RECORDING_SECONDS } from "./voice.types";

interface VoiceRecorderProps {
  /** Called when the doctor confirms the structured data. Populates the consultation form. */
  onResult: (data: { transcript: string; structured: StructuredConsultation }) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const stepLabels: Record<string, string> = {
  uploading: "Envoi de l'audio…",
  transcribing: "Transcription en cours…",
  structuring: "Structuration IA…",
};

export function VoiceRecorder({ onResult }: VoiceRecorderProps) {
  const {
    recordingStatus,
    processingStep,
    elapsed,
    startRecording,
    stopRecording,
    cancelRecording,
    result,
    error,
    reset,
  } = useVoiceRecorder();

  const isProcessing = ["uploading", "transcribing", "structuring"].includes(processingStep);

  // ── Idle state ─────────────────────────────────────────────────────────

  if (recordingStatus === "idle" && processingStep === "idle") {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-dashed border-healthcare/40 text-healthcare hover:bg-healthcare/5 hover:text-healthcare"
        onClick={startRecording}
      >
        <Mic className="size-4" />
        Enregistrer la consultation (voix)
      </Button>
    );
  }

  // ── Recording state ────────────────────────────────────────────────────

  if (recordingStatus === "recording") {
    const pct = Math.min((elapsed / MAX_RECORDING_SECONDS) * 100, 100);

    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium text-red-700">Enregistrement…</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-red-600 tabular-nums">
              <Clock className="size-3.5" />
              {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-red-100">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={stopRecording}
            >
              <Square className="size-3.5" />
              Arrêter
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelRecording}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Processing state ───────────────────────────────────────────────────

  if (isProcessing) {
    return (
      <Card className="border-healthcare/20 bg-healthcare/5">
        <CardContent className="flex items-center gap-3 p-4">
          <Loader2 className="size-5 animate-spin text-healthcare" />
          <div>
            <p className="text-sm font-medium text-healthcare">
              {stepLabels[processingStep] ?? "Traitement…"}
            </p>
            <p className="text-xs text-muted-foreground">
              Veuillez patienter, ne fermez pas la page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (processingStep === "error") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Échec du traitement</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={reset}>
            <RotateCcw className="size-3.5" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Done state — show preview of structured data ───────────────────────

  if (processingStep === "done" && result) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="size-4" />
            Consultation structurée par IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2 rounded-lg bg-white/80 p-3 text-sm">
            <PreviewField label="Motif" value={result.structured.motif} />
            <PreviewField label="Diagnostic" value={result.structured.diagnostic} />
            <PreviewField label="Traitement" value={result.structured.traitement} />
            <PreviewField label="Suivi" value={result.structured.suivi} />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Ces champs seront pré-remplis dans le formulaire. Vous pourrez les modifier avant de sauvegarder.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-1.5 bg-green-600 text-white hover:bg-green-700"
              onClick={() => onResult(result)}
            >
              <CheckCircle2 className="size-3.5" />
              Utiliser ces données
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" />
              Refaire
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-semibold text-muted-foreground">{label} :</span>{" "}
      <span>{value || "—"}</span>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Mic, Square, Loader2, RotateCcw, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "./useVoiceRecorder";
import { MAX_RECORDING_SECONDS } from "./voice.types";

interface VoiceDescriptionButtonProps {
  /** Called with the transcribed text once transcription succeeds. */
  onTranscript: (text: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceDescriptionButton({ onTranscript }: VoiceDescriptionButtonProps) {
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
  const deliveredRef = useRef(false);

  // ── Auto-deliver transcript exactly once when done ─────────────────────
  useEffect(() => {
    if (processingStep === "done" && result && !deliveredRef.current) {
      deliveredRef.current = true;
      onTranscript(result.transcript);
      reset();
    }
    if (processingStep === "idle") {
      deliveredRef.current = false;
    }
  }, [processingStep, result, onTranscript, reset]);

  // ── Idle state: show mic button ────────────────────────────────────────
  if (recordingStatus === "idle" && processingStep === "idle") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-dashed border-amber-400/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
        onClick={startRecording}
      >
        <Mic className="size-3.5" />
        Dicter les symptômes
      </Button>
    );
  }

  // ── Recording state ────────────────────────────────────────────────────
  if (recordingStatus === "recording") {
    const pct = Math.min((elapsed / MAX_RECORDING_SECONDS) * 100, 100);

    return (
      <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-700">Enregistrement…</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-red-600 tabular-nums">
            <Clock className="size-3" />
            {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
          </div>
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-red-100">
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
            className="flex-1 gap-1.5 h-8 text-xs"
            onClick={stopRecording}
          >
            <Square className="size-3" />
            Arrêter
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={cancelRecording}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // ── Processing state ───────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <Loader2 className="size-4 animate-spin text-amber-600" />
        <span className="text-xs font-medium text-amber-700">Transcription en cours…</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (processingStep === "error") {
    return (
      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs" onClick={reset}>
          <RotateCcw className="size-3" />
          Réessayer
        </Button>
      </div>
    );
  }

  return null;
}

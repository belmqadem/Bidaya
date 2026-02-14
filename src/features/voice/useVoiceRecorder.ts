"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type {
  RecordingStatus,
  ProcessingStep,
  StructuredConsultation,
} from "./voice.types";
import { MAX_RECORDING_SECONDS, ACCEPTED_AUDIO_TYPE } from "./voice.types";
import { transcribeAndStructure } from "./voice.service";

export interface UseVoiceRecorderReturn {
  /** Current recording state. */
  recordingStatus: RecordingStatus;
  /** Current backend processing step. */
  processingStep: ProcessingStep;
  /** Elapsed recording time in seconds. */
  elapsed: number;
  /** Start recording from the microphone. */
  startRecording: () => Promise<void>;
  /** Stop recording (triggers processing). */
  stopRecording: () => void;
  /** Cancel recording and discard audio. */
  cancelRecording: () => void;
  /** Structured result after processing completes. */
  result: { transcript: string; structured: StructuredConsultation } | null;
  /** Error message if something went wrong. */
  error: string | null;
  /** Reset everything to initial state. */
  reset: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<UseVoiceRecorderReturn["result"]>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Cleanup helpers ──────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  // ── Start recording ──────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);
    setProcessingStep("idle");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(ACCEPTED_AUDIO_TYPE)
          ? ACCEPTED_AUDIO_TYPE
          : undefined,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        releaseStream();
        processAudio();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms

      setRecordingStatus("recording");
      setElapsed(0);

      // Elapsed timer
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - start) / 1000);
        setElapsed(secs);

        // Auto-stop at limit
        if (secs >= MAX_RECORDING_SECONDS) {
          recorder.stop();
          stopTimer();
          setRecordingStatus("stopped");
        }
      }, 250);
    } catch {
      setError("Impossible d'accéder au microphone. Vérifiez les permissions.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stop recording ───────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
      stopTimer();
      setRecordingStatus("stopped");
    }
  }, [stopTimer]);

  // ── Cancel ───────────────────────────────────────────────────────────────

  const cancelRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = null; // prevent processAudio
      mr.stop();
    }
    stopTimer();
    releaseStream();
    chunksRef.current = [];
    setRecordingStatus("idle");
    setProcessingStep("idle");
    setElapsed(0);
  }, [stopTimer, releaseStream]);

  // ── Process audio (upload → transcribe → structure) ──────────────────────

  async function processAudio() {
    const blob = new Blob(chunksRef.current, { type: ACCEPTED_AUDIO_TYPE });
    if (blob.size === 0) {
      setError("Aucun audio enregistré.");
      setProcessingStep("error");
      return;
    }

    try {
      setProcessingStep("uploading");

      // Small visual delay so user sees "Envoi..." before jumping to next step
      setProcessingStep("transcribing");

      const response = await transcribeAndStructure(blob);

      setProcessingStep("done");
      setResult({
        transcript: response.transcript,
        structured: response.structured,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue.";
      setError(msg);
      setProcessingStep("error");
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    cancelRecording();
    setResult(null);
    setError(null);
    setProcessingStep("idle");
    setRecordingStatus("idle");
    setElapsed(0);
  }, [cancelRecording]);

  return {
    recordingStatus,
    processingStep,
    elapsed,
    startRecording,
    stopRecording,
    cancelRecording,
    result,
    error,
    reset,
  };
}

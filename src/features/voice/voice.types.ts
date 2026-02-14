/**
 * Voice-to-text feature types.
 * Used by the recorder hook, service layer, and UI component.
 */

// ── Recording states ─────────────────────────────────────────────────────────

export type RecordingStatus = "idle" | "recording" | "stopped";

// ── Pipeline states (after recording) ────────────────────────────────────────

export type ProcessingStep = "idle" | "uploading" | "transcribing" | "structuring" | "done" | "error";

// ── Structured consultation returned by the backend ──────────────────────────

export interface StructuredConsultation {
  motif: string;
  diagnostic: string;
  traitement: string;
  suivi: string;
}

// ── Full API response ────────────────────────────────────────────────────────

export interface VoiceTranscribeResponse {
  transcript: string;
  structured: StructuredConsultation;
  processingTimeMs: number;
  detectedLanguage?: string;
}

// ── Error shape from API ─────────────────────────────────────────────────────

export interface VoiceApiError {
  error: string;
  retryable?: boolean;
}

// ── Limits ────────────────────────────────────────────────────────────────────

/** Maximum recording duration in seconds. */
export const MAX_RECORDING_SECONDS = 120;

/** Accepted MIME type for audio upload. */
export const ACCEPTED_AUDIO_TYPE = "audio/webm";

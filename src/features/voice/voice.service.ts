/**
 * Client-side service that sends recorded audio to the backend
 * transcription endpoint.
 */

import type { VoiceTranscribeResponse, VoiceApiError } from "./voice.types";

/**
 * Transcribe-only: send audio to `/api/voice/transcribe` and get back raw text.
 * No MiniMax structuring. Used for the symptom description field.
 *
 * @throws Error with a user-facing message on failure.
 */
export async function transcribeAudio(
  audioBlob: Blob,
): Promise<{ transcript: string; detectedLanguage?: string }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch("/api/voice/transcribe?mode=transcribe", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as VoiceApiError;
    throw new Error(err.error ?? "Erreur inconnue lors de la transcription.");
  }

  return {
    transcript: data.transcript,
    detectedLanguage: data.detectedLanguage,
  };
}

/**
 * Full pipeline: send audio to `/api/voice/transcribe?mode=full` for
 * ElevenLabs STT + MiniMax structuring.
 *
 * @throws Error with a user-facing message on failure.
 */
export async function transcribeAndStructure(
  audioBlob: Blob,
): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch("/api/voice/transcribe?mode=full", {
    method: "POST",
    body: formData,
  });

  const data: VoiceTranscribeResponse | VoiceApiError = await res.json();

  if (!res.ok) {
    const err = data as VoiceApiError;
    throw new Error(err.error ?? "Erreur inconnue lors de la transcription.");
  }

  return data as VoiceTranscribeResponse;
}

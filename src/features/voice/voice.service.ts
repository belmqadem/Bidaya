/**
 * Client-side service that sends recorded audio to the backend
 * transcription + structuring endpoint.
 */

import type { VoiceTranscribeResponse, VoiceApiError } from "./voice.types";

/**
 * Send an audio blob to `/api/voice/transcribe`.
 * The backend handles ElevenLabs STT + MiniMax structuring.
 *
 * @throws Error with a user-facing message on failure.
 */
export async function transcribeAndStructure(
  audioBlob: Blob,
): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch("/api/voice/transcribe", {
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

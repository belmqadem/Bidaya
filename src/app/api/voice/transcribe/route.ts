import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// ── Config ───────────────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY ?? "";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

const IS_DEV = process.env.NODE_ENV !== "production";

// Max audio file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Rate limiting (in-memory, per-server) ────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per user

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// ── MiniMax prompt ───────────────────────────────────────────────────────────

const STRUCTURING_PROMPT = `Tu es un extracteur JSON. Tu ne réfléchis pas. Tu ne commentes pas. Tu retournes UNIQUEMENT un objet JSON.

Extrais les informations de la transcription médicale et retourne ce JSON exact :

{"motif":"...","diagnostic":"...","traitement":"...","suivi":"..."}

Règles STRICTES :
- motif = raison de la consultation. Si absente, mets "".
- diagnostic = diagnostic posé. Si absent, mets "".
- traitement = traitement prescrit. Si absent, mets "".
- suivi = instructions de suivi. Si absent, mets "".
- Rédige en français.
- NE METS AUCUN texte avant ou après le JSON.
- NE METS PAS de blocs <think>.
- Ta réponse COMPLÈTE doit être parsable par JSON.parse().`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number, retryable = false, detail?: string) {
  return NextResponse.json(
    { error: message, retryable, ...(IS_DEV && detail ? { detail } : {}) },
    { status },
  );
}

interface StructuredResult {
  motif: string;
  diagnostic: string;
  traitement: string;
  suivi: string;
}

function validateStructured(obj: unknown): StructuredResult | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;

  const motif = typeof o.motif === "string" ? o.motif : "";
  const diagnostic = typeof o.diagnostic === "string" ? o.diagnostic : "";
  const traitement = typeof o.traitement === "string" ? o.traitement : "";
  const suivi = typeof o.suivi === "string" ? o.suivi : "";

  // At least one field must be non-empty
  if (!motif && !diagnostic && !traitement && !suivi) return null;

  return { motif, diagnostic, traitement, suivi };
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // ── 1. Auth: require parent or clinic role ────────────────────────────────
  const session = await getSession();
  if (!session || (session.role !== "clinic" && session.role !== "parent")) {
    return jsonError("Non autorisé.", 403);
  }

  // Check mode: "transcribe" (transcript only) or "full" (transcript + structuring)
  const mode = request.nextUrl.searchParams.get("mode") === "full" ? "full" : "transcribe";

  // ── 2. Rate limit ────────────────────────────────────────────────────────
  if (!checkRateLimit(session.email)) {
    return jsonError("Trop de requêtes. Veuillez patienter une minute.", 429);
  }

  // ── 3. Validate API keys ─────────────────────────────────────────────────
  if (!ELEVENLABS_API_KEY) {
    return jsonError("ELEVENLABS_API_KEY non configurée sur le serveur.", 500);
  }
  if (mode === "full" && !MINIMAX_API_KEY) {
    return jsonError("MINIMAX_API_KEY non configurée sur le serveur.", 500);
  }

  // ── 4. Extract audio file from FormData ──────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Corps de requête invalide (FormData attendu).", 400);
  }

  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    return jsonError("Fichier audio manquant dans la requête.", 400);
  }

  if (audioFile.size > MAX_FILE_SIZE) {
    return jsonError("Le fichier audio dépasse la taille maximale (10 Mo).", 400);
  }

  if (audioFile.size === 0) {
    return jsonError("Le fichier audio est vide.", 400);
  }

  // ── 5. Convert to Buffer-backed File for reliable forwarding ─────────────
  // The incoming Blob from Next.js formData may not forward bytes correctly
  // to outgoing fetch calls. Reading into an ArrayBuffer and creating a new
  // Blob ensures the data is fully materialized.
  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await audioFile.arrayBuffer();
  } catch {
    return jsonError("Impossible de lire le fichier audio.", 400);
  }

  const audioBlob = new Blob([audioBuffer], { type: audioFile.type || "audio/webm" });

  if (IS_DEV) {
    console.log(
      `[voice] Audio received: ${audioBlob.size} bytes, type=${audioBlob.type}`,
    );
  }

  // ── 6. Call ElevenLabs Speech-to-Text ────────────────────────────────────
  let transcript: string;
  let detectedLanguage: string | undefined;

  try {
    const sttForm = new FormData();
    sttForm.append("file", audioBlob, "recording.webm");
    sttForm.append("model_id", "scribe_v1");

    const sttRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: sttForm,
    });

    if (!sttRes.ok) {
      const errText = await sttRes.text().catch(() => "");
      console.error("ElevenLabs STT error:", sttRes.status, errText);
      return jsonError(
        "Échec de la transcription audio. Veuillez réessayer.",
        502,
        true,
        `ElevenLabs HTTP ${sttRes.status}: ${errText.slice(0, 500)}`,
      );
    }

    const sttData = await sttRes.json();
    transcript = sttData.text ?? "";
    detectedLanguage = sttData.language_code;

    if (IS_DEV) {
      console.log(
        `[voice] Transcript (${detectedLanguage}): "${transcript.slice(0, 120)}…"`,
      );
    }

    if (!transcript.trim()) {
      return jsonError(
        "Aucun texte détecté dans l'enregistrement. Parlez plus distinctement et réessayez.",
        422,
      );
    }
  } catch (e) {
    console.error("ElevenLabs STT network error:", e);
    return jsonError(
      "Erreur réseau lors de la transcription. Vérifiez votre connexion.",
      502,
      true,
      String(e),
    );
  }

  // ── 7. Optionally call MiniMax for structuring (full mode only) ─────────
  let structured: StructuredResult | undefined;

  if (mode === "full") {
    const emptyResult: StructuredResult = { motif: "", diagnostic: "", traitement: "", suivi: "" };
    structured = emptyResult;

    try {
      const mmRes = await fetch(MINIMAX_BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MINIMAX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          messages: [
            { role: "system", content: STRUCTURING_PROMPT },
            {
              role: "user",
              content: `Transcription :\n"""${transcript}"""\n\nRetourne le JSON maintenant :`,
            },
          ],
          max_tokens: 4000,
          temperature: 0,
        }),
      });

      if (!mmRes.ok) {
        const errText = await mmRes.text().catch(() => "");
        console.error("[voice] MiniMax HTTP error:", mmRes.status, errText);
      } else {
        const mmData = await mmRes.json();
        const raw: string = mmData?.choices?.[0]?.message?.content ?? "";

        if (IS_DEV) {
          console.log(`[voice] MiniMax raw (${raw.length} chars): "${raw.slice(0, 400)}"`);
        }

        // Strip <think>...</think> blocks (closed and unclosed)
        let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "");
        cleaned = cleaned.replace(/<think>[\s\S]*/g, "");
        cleaned = cleaned.trim();

        let parsed: StructuredResult | null = null;
        try {
          parsed = validateStructured(JSON.parse(cleaned));
        } catch {
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = validateStructured(JSON.parse(jsonMatch[0]));
            } catch { /* continue */ }
          }
        }

        if (!parsed) {
          const rawMatch = raw.match(/\{[\s\S]*"motif"[\s\S]*?\}/);
          if (rawMatch) {
            try {
              parsed = validateStructured(JSON.parse(rawMatch[0]));
            } catch { /* give up */ }
          }
        }

        if (parsed) {
          structured = parsed;
        } else {
          console.warn("[voice] MiniMax could not produce valid JSON — falling back to empty fields");
        }
      }
    } catch (e) {
      console.error("[voice] MiniMax network error:", e);
    }
  }

  // ── 8. Return successful response ────────────────────────────────────────

  const processingTimeMs = Date.now() - startTime;

  if (IS_DEV) {
    console.log(`[voice] Done in ${processingTimeMs}ms (mode=${mode})`);
  }

  return NextResponse.json({
    transcript,
    ...(structured ? { structured } : {}),
    processingTimeMs,
    ...(detectedLanguage ? { detectedLanguage } : {}),
  });
}

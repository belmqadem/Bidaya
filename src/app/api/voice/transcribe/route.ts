import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// ── Config ───────────────────────────────────────────────────────────────────

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY ?? "";
const MINIMAX_BASE_URL =
  process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

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

const STRUCTURING_PROMPT = `Tu es un assistant clinique pédiatrique.
Convertis la transcription de consultation suivante en JSON structuré avec exactement ces 4 champs :
- motif (string) : le motif de la consultation
- diagnostic (string) : le diagnostic posé
- traitement (string) : le traitement prescrit
- suivi (string) : les instructions de suivi

Règles :
- Retourne UNIQUEMENT du JSON valide, sans texte autour.
- Si un champ n'est pas mentionné dans la transcription, mets une chaîne vide "".
- Rédige en français.
- Sois concis et clinique.`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number, retryable = false) {
  return NextResponse.json({ error: message, retryable }, { status });
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

  // ── 1. Auth: require clinic role ─────────────────────────────────────────
  const session = await getSession();
  if (!session || session.role !== "clinic") {
    return jsonError("Non autorisé. Accès réservé à l'espace clinique.", 403);
  }

  // ── 2. Rate limit ────────────────────────────────────────────────────────
  if (!checkRateLimit(session.email)) {
    return jsonError("Trop de requêtes. Veuillez patienter une minute.", 429);
  }

  // ── 3. Validate API keys ─────────────────────────────────────────────────
  if (!ELEVENLABS_API_KEY) {
    return jsonError("ELEVENLABS_API_KEY non configurée sur le serveur.", 500);
  }
  if (!MINIMAX_API_KEY) {
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

  // ── 5. Call ElevenLabs Speech-to-Text ────────────────────────────────────
  let transcript: string;
  let detectedLanguage: string | undefined;

  try {
    const sttForm = new FormData();
    sttForm.append("file", audioFile, "recording.webm");
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
      );
    }

    const sttData = await sttRes.json();
    transcript = sttData.text ?? "";
    detectedLanguage = sttData.language_code;

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
    );
  }

  // ── 6. Call MiniMax for structuring ──────────────────────────────────────
  let structured: StructuredResult | null = null;

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
          { role: "user", content: `Transcription de la consultation :\n\n${transcript}` },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!mmRes.ok) {
      const errText = await mmRes.text().catch(() => "");
      console.error("MiniMax error:", mmRes.status, errText);
      return jsonError(
        "Échec de la structuration IA. Veuillez réessayer.",
        502,
        true,
      );
    }

    const mmData = await mmRes.json();
    const raw: string = mmData?.choices?.[0]?.message?.content ?? "";

    // Strip <think>...</think> blocks (MiniMax reasoning artifacts)
    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "");
    cleaned = cleaned.replace(/<think>[\s\S]*/g, "");
    cleaned = cleaned.trim();

    // Strategy 1: parse cleaned text directly
    try {
      structured = validateStructured(JSON.parse(cleaned));
    } catch {
      // Strategy 2: extract JSON from text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          structured = validateStructured(JSON.parse(jsonMatch[0]));
        } catch {
          // continue to fallback
        }
      }
    }

    // Strategy 3: search raw output
    if (!structured) {
      const rawMatch = raw.match(/\{[\s\S]*"motif"[\s\S]*\}/);
      if (rawMatch) {
        try {
          structured = validateStructured(JSON.parse(rawMatch[0]));
        } catch {
          // give up
        }
      }
    }

    if (!structured) {
      return jsonError(
        "L'IA n'a pas pu structurer la consultation. Veuillez réessayer.",
        502,
        true,
      );
    }
  } catch (e) {
    console.error("MiniMax network error:", e);
    return jsonError(
      "Erreur réseau lors de la structuration IA.",
      502,
      true,
    );
  }

  // ── 7. Return successful response ────────────────────────────────────────

  const processingTimeMs = Date.now() - startTime;

  return NextResponse.json({
    transcript,
    structured,
    processingTimeMs,
    ...(detectedLanguage ? { detectedLanguage } : {}),
  });
}

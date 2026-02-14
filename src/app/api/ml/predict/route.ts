import { NextRequest, NextResponse } from "next/server";

// ── Types ───────────────────────────────────────────────────────────────────
interface PredictionInput {
  gestationWeeks: number;
  parity: number;
  maternalAge: number;
  maternalHeight: number; // cm
  maternalWeight: number; // kg
  smokingStatus: boolean;
}

interface AIResponse {
  predicted_weight_grams: number;
  risk_level: "LOW" | "MODERATE" | "HIGH";
  clinical_note: string;
}

// ── Config from env ─────────────────────────────────────────────────────────
const API_KEY = process.env.MINIMAX_API_KEY ?? "";
const BASE_URL =
  process.env.MINIMAX_BASE_URL ??
  "https://api.minimax.io/v1/chat/completions";
const MODEL = process.env.MINIMAX_MODEL ?? "MiniMax-M2.5";

// ── System prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un assistant d'évaluation du risque néonatal utilisé dans une clinique de soins primaires au Maroc.

Toutes les mesures utilisent le système métrique.

À partir des données maternelles et de grossesse, estime le poids de naissance du nouveau-né en grammes et classe le risque néonatal.

Retourne UNIQUEMENT du JSON valide dans ce format exact :

{
  "predicted_weight_grams": number,
  "risk_level": "LOW" | "MODERATE" | "HIGH",
  "clinical_note": string
}

Classification du risque :
- LOW : poids estimé > 3000 grammes
- MODERATE : 2500–3000 grammes
- HIGH : < 2500 grammes

Consignes :
- Utilise un raisonnement clinique réaliste
- N'inclus PAS d'unités dans les nombres
- N'inclus PAS de texte en dehors du JSON
- Rédige la clinical_note en français, courte et neutre`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PredictionInput;

    // Validate required fields
    const {
      gestationWeeks,
      parity,
      maternalAge,
      maternalHeight,
      maternalWeight,
      smokingStatus,
    } = body;

    if (
      !gestationWeeks ||
      maternalAge == null ||
      maternalHeight == null ||
      maternalWeight == null
    ) {
      return NextResponse.json(
        { error: "Champs maternels requis manquants." },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: "MINIMAX_API_KEY non configurée sur le serveur." },
        { status: 500 }
      );
    }

    // Build user message (metric, French)
    const userMsg = `Données maternelles et de grossesse pour l'enregistrement du nouveau-né :

Gestation : ${gestationWeeks} semaines
Parité : ${parity}
Âge de la mère : ${maternalAge} ans
Taille de la mère : ${maternalHeight} cm
Poids de la mère : ${maternalWeight} kg
Tabagisme pendant la grossesse : ${smokingStatus ? "oui" : "non"}

Estime le poids de naissance et la classification du risque.`;

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    const result = await response.json();
    const raw: string = result?.choices?.[0]?.message?.content ?? "";

    // Strip <think>...</think> blocks (closed and unclosed)
    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "");
    cleaned = cleaned.replace(/<think>[\s\S]*/g, "");
    cleaned = cleaned.trim();

    // Try to parse JSON response
    let aiResponse: AIResponse | null = null;

    // Strategy 1: parse the cleaned text as JSON directly
    try {
      aiResponse = JSON.parse(cleaned);
    } catch {
      // Strategy 2: extract JSON object from the text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiResponse = JSON.parse(jsonMatch[0]);
        } catch {
          // Strategy 3: also look inside the raw (think block) for JSON
        }
      }
    }

    // Strategy 3: fallback — look for JSON inside the full raw response
    if (!aiResponse) {
      const rawJsonMatch = raw.match(
        /\{\s*"predicted_weight_grams"\s*:\s*\d[\s\S]*?\}/
      );
      if (rawJsonMatch) {
        try {
          aiResponse = JSON.parse(rawJsonMatch[0]);
        } catch {
          // give up on JSON parsing
        }
      }
    }

    // Strategy 4: last resort — extract a number from anywhere
    if (!aiResponse) {
      const allNumbers = raw.match(/\b(\d{3,4})\b/g) ?? [];
      const plausible = allNumbers
        .map(Number)
        .filter((n) => n >= 1000 && n <= 6000);
      if (plausible.length > 0) {
        const weight = plausible[plausible.length - 1];
        let riskLevel: "LOW" | "MODERATE" | "HIGH";
        if (weight < 2500) riskLevel = "HIGH";
        else if (weight <= 3000) riskLevel = "MODERATE";
        else riskLevel = "LOW";

        aiResponse = {
          predicted_weight_grams: weight,
          risk_level: riskLevel,
          clinical_note: "Estimation extraite du raisonnement du modèle IA.",
        };
      }
    }

    if (!aiResponse || !aiResponse.predicted_weight_grams) {
      return NextResponse.json(
        { error: "Impossible d'extraire une prédiction du modèle." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      predictedWeight: Math.round(aiResponse.predicted_weight_grams),
      riskLevel: aiResponse.risk_level,
      explanation: aiResponse.clinical_note,
    });
  } catch (err) {
    console.error("ML prediction error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse IA." },
      { status: 500 }
    );
  }
}

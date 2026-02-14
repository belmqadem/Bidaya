// ── Input/Output types ──────────────────────────────────────────────────────

export interface NeonatalRiskInput {
  gestationWeeks: number;
  parity: number;
  maternalAge: number;
  maternalHeight: number; // cm
  maternalWeight: number; // kg
  smokingStatus: boolean;
}

export interface NeonatalRiskResult {
  predictedWeight: number; // grams
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  explanation: string;
}

// ── Service function ────────────────────────────────────────────────────────

/**
 * Calls the server-side ML prediction API.
 * Returns the predicted birth weight (grams), risk level, and clinical note.
 * Throws on network or server errors — caller should handle gracefully.
 */
export async function predictNeonatalRisk(
  input: NeonatalRiskInput
): Promise<NeonatalRiskResult> {
  const res = await fetch("/api/ml/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Erreur inconnue du service IA.");
  }

  return {
    predictedWeight: data.predictedWeight,
    riskLevel: data.riskLevel,
    explanation: data.explanation,
  };
}

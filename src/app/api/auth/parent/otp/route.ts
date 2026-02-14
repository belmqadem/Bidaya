import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { setSession } from "@/lib/auth";

/**
 * Étape 2 : Le parent soumet le code OTP.
 * En cas de succès, crée une session parent liée à l'enfant.
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: string; phone?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  if (!identifier || !phone || !otp) {
    return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
  }

  const valid = verifyOtp(identifier, phone, otp);
  if (!valid) {
    return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 401 });
  }

  // Créer la session parent avec l'identifiant enfant
  await setSession({
    email: phone, // utiliser le téléphone comme identifiant pour le parent
    role: "parent",
    childIdentifier: identifier,
  });

  return NextResponse.json({ redirect: "/parent" });
}

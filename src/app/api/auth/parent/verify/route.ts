import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp-store";

/**
 * Étape 1 : Le parent entre l'identifiant enfant + téléphone.
 * Le serveur vérifie que l'enfant existe et que le téléphone correspond.
 * Génère un OTP et le renvoie dans la réponse (MVP — pas de SMS).
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!identifier) {
    return NextResponse.json({ error: "L'identifiant enfant est requis." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Le numéro de téléphone est requis." }, { status: 400 });
  }

  try {
    const child = await prisma.child.findUnique({
      where: { identifier },
      select: { parentContact: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Aucun enfant trouvé avec cet identifiant." }, { status: 404 });
    }

    // MVP : comparaison simple du téléphone
    if (child.parentContact.trim() !== phone) {
      return NextResponse.json({ error: "Le numéro de téléphone ne correspond pas à nos enregistrements." }, { status: 403 });
    }

    const otp = createOtp(identifier, phone);

    // MVP : retourner l'OTP dans la réponse (pas de SMS)
    return NextResponse.json({
      success: true,
      message: `Code de vérification envoyé. (MVP : votre code est ${otp})`,
      otp, // À supprimer en production
    });
  } catch (err) {
    console.error("Parent verify error:", err);
    return NextResponse.json({ error: "Échec de la vérification. Veuillez réessayer." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, setSession } from "@/lib/auth";
import { isUserRole } from "@/types/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = typeof body.role === "string" ? body.role : "";

  if (!validateCredentials(email)) {
    return NextResponse.json({ error: "L'e-mail est requis" }, { status: 400 });
  }
  if (!isUserRole(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  await setSession({ email, role });

  const redirect = role === "parent" ? "/parent" : "/clinic";
  return NextResponse.json({ redirect });
}

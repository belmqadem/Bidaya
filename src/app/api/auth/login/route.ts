import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, setSessionEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }
  const email = typeof body.email === "string" ? body.email : "";
  if (!validateCredentials(email, body.password)) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }
  await setSessionEmail(email.trim());
  return NextResponse.json({ redirect: "/select-role" });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { setSession } from "@/lib/auth";

/**
 * Step 2: Parent submits OTP.
 * On success, creates a parent session linked to the child.
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: string; phone?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const otp = typeof body.otp === "string" ? body.otp.trim() : "";

  if (!identifier || !phone || !otp) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const valid = verifyOtp(identifier, phone, otp);
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  // Set parent session with childIdentifier
  await setSession({
    email: phone, // use phone as the "email" identifier for parent
    role: "parent",
    childIdentifier: identifier,
  });

  return NextResponse.json({ redirect: "/parent" });
}

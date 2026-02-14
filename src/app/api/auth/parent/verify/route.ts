import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOtp } from "@/lib/otp-store";

/**
 * Step 1: Parent enters child identifier + phone.
 * Server validates child exists and phone matches parentContact.
 * Generates OTP and returns it in the response (MVP — no SMS).
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!identifier) {
    return NextResponse.json({ error: "Child identifier is required." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  try {
    const child = await prisma.child.findUnique({
      where: { identifier },
      select: { parentContact: true },
    });

    if (!child) {
      return NextResponse.json({ error: "No child found with this identifier." }, { status: 404 });
    }

    // MVP: loose phone match (trim and compare)
    if (child.parentContact.trim() !== phone) {
      return NextResponse.json({ error: "Phone number does not match our records." }, { status: 403 });
    }

    const otp = createOtp(identifier, phone);

    // MVP: return OTP in response (no SMS)
    return NextResponse.json({
      success: true,
      message: `Verification code sent. (MVP: your code is ${otp})`,
      otp, // Remove in production
    });
  } catch {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  await clearSession();
  return NextResponse.redirect(new URL("/select-role", _request.url), 303);
}

import { NextRequest, NextResponse } from "next/server";
import { setSessionRole } from "@/lib/auth";
import { isUserRole } from "@/types/auth";

export async function POST(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get("role");
  if (!roleParam || !isUserRole(roleParam)) {
    return NextResponse.redirect(new URL("/select-role", request.url));
  }
  await setSessionRole(roleParam);
  const redirectUrl = roleParam === "parent" ? "/parent" : "/clinic";
  return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
}

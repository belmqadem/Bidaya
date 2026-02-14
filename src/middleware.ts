import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

const SELECT_ROLE = "/select-role";

function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

function dashboardFor(role: string) {
  return role === "parent" ? "/parent" : "/clinic";
}

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = raw ? decodeSession(raw) : null;
  const hasSession = !!payload?.email && !!payload?.role;
  const path = request.nextUrl.pathname;

  // ── Home → select-role or dashboard ─────────────────────────────────────
  if (path === "/") {
    if (hasSession) return redirectTo(dashboardFor(payload!.role!), request);
    return redirectTo(SELECT_ROLE, request);
  }

  // ── Select-role: public — skip if already authenticated ─────────────────
  if (path === SELECT_ROLE) {
    if (hasSession) return redirectTo(dashboardFor(payload!.role!), request);
    return NextResponse.next();
  }

  // ── Login pages: public — skip if already authenticated ─────────────────
  if (path === "/login" || path === "/login/parent") {
    if (hasSession) return redirectTo(dashboardFor(payload!.role!), request);
    return NextResponse.next();
  }

  // ── Protected: /parent/* ────────────────────────────────────────────────
  if (path.startsWith("/parent")) {
    if (!hasSession) return redirectTo("/login/parent", request);
    if (payload!.role !== "parent") return redirectTo("/clinic", request);
    return NextResponse.next();
  }

  // ── Protected: /clinic/* ────────────────────────────────────────────────
  if (path.startsWith("/clinic")) {
    if (!hasSession) return redirectTo(SELECT_ROLE, request);
    if (payload!.role !== "clinic") return redirectTo("/parent", request);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/parent",
    "/select-role",
    "/parent/:path*",
    "/clinic/:path*",
  ],
};

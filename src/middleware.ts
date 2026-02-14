import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/auth";

const LOGIN = "/login";
const SELECT_ROLE = "/select-role";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = sessionCookie ? decodeSession(sessionCookie) : null;
  const path = request.nextUrl.pathname;

  // Public routes
  if (path === LOGIN || path.startsWith("/api/auth/login")) {
    if (payload?.email && payload.role) {
      return NextResponse.redirect(new URL(payload.role === "parent" ? "/parent" : "/clinic", request.url));
    }
    if (payload?.email) {
      return NextResponse.redirect(new URL(SELECT_ROLE, request.url));
    }
    return NextResponse.next();
  }

  if (path === SELECT_ROLE || path.startsWith("/api/auth/select-role")) {
    if (!payload?.email) return NextResponse.redirect(new URL(LOGIN, request.url));
    if (payload.role) {
      return NextResponse.redirect(new URL(payload.role === "parent" ? "/parent" : "/clinic", request.url));
    }
    return NextResponse.next();
  }

  // Protected role routes
  if (path.startsWith("/parent")) {
    if (!payload?.email) return NextResponse.redirect(new URL(LOGIN, request.url));
    if (!payload.role) return NextResponse.redirect(new URL(SELECT_ROLE, request.url));
    if (payload.role !== "parent") return NextResponse.redirect(new URL("/clinic", request.url));
    return NextResponse.next();
  }

  if (path.startsWith("/clinic")) {
    if (!payload?.email) return NextResponse.redirect(new URL(LOGIN, request.url));
    if (!payload.role) return NextResponse.redirect(new URL(SELECT_ROLE, request.url));
    if (payload.role !== "clinic") return NextResponse.redirect(new URL("/parent", request.url));
    return NextResponse.next();
  }

  // Home: redirect to login or role-specific dashboard
  if (path === "/") {
    if (!payload?.email) return NextResponse.redirect(new URL(LOGIN, request.url));
    if (!payload.role) return NextResponse.redirect(new URL(SELECT_ROLE, request.url));
    return NextResponse.redirect(new URL(payload.role === "parent" ? "/parent" : "/clinic", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/select-role", "/parent/:path*", "/clinic/:path*", "/api/auth/login", "/api/auth/select-role"],
};

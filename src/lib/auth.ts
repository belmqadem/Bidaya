/**
 * Centralized session auth for MVP.
 * Cookie-based. No external providers.
 *
 * Parent sessions carry a childIdentifier — scoped to one child.
 * Clinic sessions use email only.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session, UserRole } from "@/types/auth";
import { isUserRole } from "@/types/auth";

// ── Constants ────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "dchr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ── Payload ──────────────────────────────────────────────────────────────────

export type SessionPayload = {
  email: string;
  role?: UserRole;
  childIdentifier?: string;
};

// ── Encode / Decode ──────────────────────────────────────────────────────────

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Decode session cookie value. Edge-safe (works without Buffer). */
export function decodeSession(value: string): SessionPayload | null {
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(value, "base64url").toString("utf-8");
    } else {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "=",
      );
      json = atob(padded);
    }
    const data = JSON.parse(json) as Record<string, unknown>;
    if (typeof data !== "object" || data === null) return null;
    const email = data.email;
    if (typeof email !== "string" || !email) return null;
    const out: SessionPayload = { email };
    if (typeof data.role === "string" && isUserRole(data.role)) {
      out.role = data.role;
    }
    if (typeof data.childIdentifier === "string" && data.childIdentifier) {
      out.childIdentifier = data.childIdentifier;
    }
    return out;
  } catch {
    return null;
  }
}

// ── Read session ─────────────────────────────────────────────────────────────

/** Get full session. Returns null when missing or role not set. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = decodeSession(raw);
  if (!payload?.role) return null;
  const session: Session = { email: payload.email, role: payload.role };
  if (payload.childIdentifier) session.childIdentifier = payload.childIdentifier;
  return session;
}

// ── Guards ────────────────────────────────────────────────────────────────────

/** Require an authenticated session. Redirects to /select-role otherwise. */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/select-role");
  return session;
}

/** Require a specific role. Redirects if wrong role. */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== role) {
    redirect(session.role === "parent" ? "/parent" : "/clinic");
  }
  return session;
}

/** Require parent role and return childIdentifier. Redirects if missing. */
export async function requireParent(): Promise<Session & { childIdentifier: string }> {
  const session = await requireRole("parent");
  if (!session.childIdentifier) redirect("/login/parent");
  return session as Session & { childIdentifier: string };
}

// ── Write session ────────────────────────────────────────────────────────────

const cookieOptions = () =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

/** Set full session. */
export async function setSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(payload), cookieOptions());
}

/** Clear session (logout). */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// ── Credentials (clinic only) ────────────────────────────────────────────────

/** MVP placeholder: accept any non-empty email. */
export function validateCredentials(email: string): boolean {
  return !!email?.trim();
}

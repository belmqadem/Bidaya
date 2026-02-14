/**
 * Placeholder session auth for MVP.
 * No external providers. Session stored in HTTP-only-style cookie (plain for dev).
 */

import { cookies } from "next/headers";
import type { Session, UserRole } from "@/types/auth";
import { isUserRole } from "@/types/auth";

export const SESSION_COOKIE = "dchr_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = { email: string; role?: UserRole };

function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Decode session from cookie value (Edge-safe). */
export function decodeSession(value: string): SessionPayload | null {
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(value, "base64url").toString("utf-8");
    } else {
      const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      json = atob(padded);
    }
    const data = JSON.parse(json) as unknown;
    if (typeof data !== "object" || data === null || !("email" in data)) return null;
    const email = (data as { email?: string }).email;
    if (typeof email !== "string" || !email) return null;
    const role = (data as { role?: string }).role;
    const out: SessionPayload = { email };
    if (typeof role === "string" && isUserRole(role)) out.role = role;
    return out;
  } catch {
    return null;
  }
}

/** Get current session from cookies (server). Returns null if missing or invalid. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = decodeSession(raw);
  if (!payload || !payload.role) return null;
  return { email: payload.email, role: payload.role };
}

/** Get session payload with optional role (for role-selection flow). */
export async function getSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

/** Set session after login (email only); role set later on select-role. */
export async function setSessionEmail(email: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession({ email }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/** Set role in existing session (after role selection). */
export async function setSessionRole(role: UserRole): Promise<void> {
  const payload = await getSessionPayload();
  if (!payload?.email) return;
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession({ email: payload.email, role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/** Clear session (logout). */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * MVP placeholder: accept any non-empty email (and optional password).
 * Replace with real validation/DB lookup later.
 */
export function validateCredentials(email: string, _password?: string): boolean {
  void _password; // MVP: not used; for future real auth
  const trimmed = email?.trim();
  return !!trimmed;
}

/**
 * Role-based auth types.
 * Roles: parent | clinic.
 * Parent sessions are linked to a specific child via childIdentifier.
 */

export const ROLES = ["parent", "clinic"] as const;
export type UserRole = (typeof ROLES)[number];

export type Session = {
  email: string;
  role: UserRole;
  /** Only set for parent sessions — the child they authenticated with. */
  childIdentifier?: string;
};

export function isUserRole(value: string): value is UserRole {
  return ROLES.includes(value as UserRole);
}

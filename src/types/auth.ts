/**
 * Role-based auth types (MVP placeholder).
 * Roles align with project: parent | clinic.
 */

export const ROLES = ["parent", "clinic"] as const;
export type UserRole = (typeof ROLES)[number];

export type Session = {
  email: string;
  role: UserRole;
};

export function isUserRole(value: string): value is UserRole {
  return ROLES.includes(value as UserRole);
}

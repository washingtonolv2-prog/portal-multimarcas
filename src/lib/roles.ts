import type { Role } from "@/lib/auth";

export const ROLES: { value: Role; label: string }[] = [
  { value: "loja", label: "Loja" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Administrador" },
];

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function parseRole(value: FormDataEntryValue | null): Role | null {
  const v = String(value ?? "");
  return ROLES.some((r) => r.value === v) ? (v as Role) : null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export type Role = "guest" | "host" | "admin";

export const ROLE_COOKIE = "kst_role";

export function isRole(v: string): v is Role {
  return v === "guest" || v === "host" || v === "admin";
}

export function defaultRedirectForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "host") return "/host";
  return "/";
}

export function canAccessHost(role: Role | null) {
  return role === "host" || role === "admin";
}

export function canAccessAdmin(role: Role | null) {
  return role === "admin";
}

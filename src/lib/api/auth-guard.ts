import { getServerSessionUser, type ServerSessionUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api/response";

type AuthSuccess = { ok: true; user: ServerSessionUser };
type AuthFailure = { ok: false; response: Response };
type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(): Promise<AuthResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Login required") };
  }
  return { ok: true, user };
}

export async function requireHost(): Promise<AuthResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Login required") };
  }
  if (user.role !== "HOST" && user.role !== "ADMIN") {
    return { ok: false, response: apiError(403, "FORBIDDEN", "Host access required") };
  }
  return { ok: true, user };
}

export async function requireAdmin(): Promise<AuthResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Login required") };
  }
  if (user.role !== "ADMIN") {
    return { ok: false, response: apiError(403, "FORBIDDEN", "Admin access required") };
  }
  return { ok: true, user };
}

export async function requireAuthWithDb() {
  const session = await getServerSessionUser();
  if (!session) {
    return { ok: false as const, response: apiError(401, "UNAUTHORIZED", "Login required") };
  }

  const user = await prisma.user.upsert({
    where: { id: session.id },
    create: {
      id: session.id,
      name: session.name,
      role: session.role,
      email: session.email,
    },
    update: {
      name: session.name,
      role: session.role,
      email: session.email,
    },
    select: { id: true, name: true, role: true, email: true },
  });

  return { ok: true as const, user };
}

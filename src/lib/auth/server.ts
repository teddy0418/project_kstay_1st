import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type DbRole = "GUEST" | "HOST" | "ADMIN";

export type ServerSessionUser = {
  id: string;
  name: string;
  role: DbRole;
  email?: string;
};

const isProd = process.env.NODE_ENV === "production";
const allowDemoCookieFallback = !isProd && process.env.KSTAY_ENABLE_DEMO_AUTH === "true";

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name ?? "Guest",
      role: session.user.role ?? "GUEST",
      email: session.user.email ?? undefined,
    };
  }

  if (!allowDemoCookieFallback) {
    return null;
  }

  const c = await cookies();
  const roleCookie = c.get("kst_role")?.value || undefined;
  if (!roleCookie) return null;

  const v = String(roleCookie).toUpperCase();
  const role: DbRole = v === "ADMIN" ? "ADMIN" : v === "HOST" ? "HOST" : "GUEST";
  return {
    id: role === "ADMIN" ? "demo-admin" : role === "HOST" ? "demo-host" : "demo-guest",
    name: role === "ADMIN" ? "Admin" : role === "HOST" ? "Host" : "Guest",
    role,
  };
}

export async function getOrCreateServerUser() {
  const session = await getServerSessionUser();
  if (!session) return null;

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
  });

  return user;
}

export async function requireAdminUser() {
  const user = await getOrCreateServerUser();
  if (!user) return null;
  const isAdmin = user.role === "ADMIN" || user.id === "demo-admin";
  return isAdmin ? user : null;
}

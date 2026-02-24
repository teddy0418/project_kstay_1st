import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/db";

const DEFAULT_ADMIN_EMAILS = ["official.kstay@gmail.com"];

function isAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const configured = String(process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const allowlist = new Set([...DEFAULT_ADMIN_EMAILS, ...configured]);
  return allowlist.has(normalized);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    ...(process.env.KAKAO_CLIENT_ID
      ? [
          KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
          }),
        ]
      : []),
    ...(process.env.LINE_CLIENT_ID
      ? [
          LineProvider({
            clientId: process.env.LINE_CLIENT_ID,
            clientSecret: process.env.LINE_CLIENT_SECRET || "",
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      const provider = account?.provider;
      if (provider !== "google" && provider !== "kakao" && provider !== "line") return false;

      const rawEmail = user.email?.trim();
      const fallbackPrefix = provider === "line" ? "line" : provider === "kakao" ? "kakao" : "oauth";
      const normalizedEmail = rawEmail
        ? rawEmail.toLowerCase()
        : `${fallbackPrefix}_${account?.providerAccountId ?? user.id ?? "unknown"}@${provider}.user`;
      const shouldBeAdmin = isAdminEmail(normalizedEmail);
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, image: true, role: true },
      });

      const dbUser = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              email: normalizedEmail,
              name: user.name || existing.name,
              image: user.image || existing.image,
              role: shouldBeAdmin ? "ADMIN" : existing.role,
            },
            select: { id: true },
          })
        : await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name || "Guest",
              image: user.image,
              role: shouldBeAdmin ? "ADMIN" : "GUEST",
            },
            select: { id: true },
          });

      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider) token.provider = account.provider;

      const raw = user?.email || token.email;
      const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, name: true, email: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
        }
      }

      if (!token.role) token.role = "GUEST";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email ?? undefined;
        session.user.provider = token.provider as string | undefined;

        const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = (dbUser.role as "GUEST" | "HOST" | "ADMIN") || "GUEST";
            return session;
          }
        }
        session.user.id = token.sub || "";
        session.user.role = (token.role as "GUEST" | "HOST" | "ADMIN") || "GUEST";
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

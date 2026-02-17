import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      if (!user.email) return false;

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      const dbUser = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: user.name || existing.name,
              image: user.image || existing.image,
            },
          })
        : await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "Guest",
              image: user.image,
              role: "GUEST",
            },
          });

      user.id = dbUser.id;
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;
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
        session.user.id = token.sub || "";
        session.user.role = (token.role as "GUEST" | "HOST" | "ADMIN") || "GUEST";
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

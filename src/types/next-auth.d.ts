import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "GUEST" | "HOST" | "ADMIN";
      provider?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "GUEST" | "HOST" | "ADMIN";
    provider?: string;
  }
}

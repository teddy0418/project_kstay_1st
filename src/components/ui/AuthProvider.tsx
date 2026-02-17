"use client";

import React, { createContext, useContext, useMemo } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

export type UserRole = "GUEST" | "HOST" | "ADMIN";
export type AuthUser = { id: string; name: string; role: UserRole; email?: string };

type AuthCtx = {
  user: AuthUser | null;
  isAuthed: boolean;
  isLoading: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: (callbackUrl?: string) => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, status } = useSession();
  const user = useMemo<AuthUser | null>(() => {
    if (!data?.user?.id) return null;
    return {
      id: data.user.id,
      name: data.user.name ?? "Guest",
      role: data.user.role ?? "GUEST",
      email: data.user.email ?? undefined,
    };
  }, [data]);

  const signInWithGoogle = async (nextPath?: string) => {
    const callbackUrl = nextPath && nextPath.startsWith("/") ? nextPath : "/";
    await nextAuthSignIn("google", { callbackUrl });
  };

  const signOut = async (callbackUrl = "/") => {
    await nextAuthSignOut({ callbackUrl });
  };

  const value = useMemo<AuthCtx>(() => {
    return { user, isAuthed: !!user, isLoading: status === "loading", signInWithGoogle, signOut };
  }, [user, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
}

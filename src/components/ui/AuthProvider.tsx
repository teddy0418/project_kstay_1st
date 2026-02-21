"use client";

import React, { createContext, useContext, useMemo } from "react";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from "next-auth/react";

export type UserRole = "GUEST" | "HOST" | "ADMIN";
export type AuthUser = { id: string; name: string; role: UserRole; email?: string };

type AuthCtx = {
  user: AuthUser | null;
  isAuthed: boolean;
  isLoading: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<unknown>;
  signInWithKakao: (nextPath?: string) => Promise<unknown>;
  signInWithLine: (nextPath?: string) => Promise<unknown>;
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
    return nextAuthSignIn("google", { callbackUrl });
  };

  const signInWithKakao = async (nextPath?: string) => {
    const callbackUrl = nextPath && nextPath.startsWith("/") ? nextPath : "/";
    return nextAuthSignIn("kakao", { callbackUrl });
  };

  const signInWithLine = async (nextPath?: string) => {
    const callbackUrl = nextPath && nextPath.startsWith("/") ? nextPath : "/";
    return nextAuthSignIn("line", { callbackUrl });
  };

  const signOut = async (callbackUrl = "/") => {
    await nextAuthSignOut({ callbackUrl, redirect: false });
  };

  const value = useMemo<AuthCtx>(() => {
    return {
      user,
      isAuthed: !!user,
      isLoading: status === "loading",
      signInWithGoogle,
      signInWithKakao,
      signInWithLine,
      signOut,
    };
  }, [user, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
}

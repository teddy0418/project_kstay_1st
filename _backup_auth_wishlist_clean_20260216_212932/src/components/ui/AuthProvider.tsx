"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "GUEST" | "HOST" | "ADMIN";
export type AuthUser = { id: string; name: string; role: UserRole };

type AuthCtx = {
  user: AuthUser | null;
  isAuthed: boolean;
  signInDemo: () => void;
  signOutLocal: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

const LS_KEYS = ["kstay_user", "kstay_logged_in", "kst_user", "kst_logged_in"];
const COOKIE_KEYS = ["kstay_user", "kstay_logged_in", "kst_user", "kst_logged_in"];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function tryParseUser(raw: string): AuthUser | null {
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (obj && typeof obj === "object") {
      const id = String(obj.id ?? "user");
      const name = String(obj.name ?? "Guest");
      const role: UserRole =
        obj.role === "HOST" ? "HOST" : obj.role === "ADMIN" ? "ADMIN" : "GUEST";
      return { id, name, role };
    }
  } catch {}

  if (raw === "1" || raw === "true" || raw === "yes" || raw === "loggedin") {
    return { id: "flag-user", name: "Guest", role: "GUEST" };
  }

  return null;
}

function detectClientUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  for (const k of LS_KEYS) {
    try {
      const v = window.localStorage.getItem(k) || "";
      const u = tryParseUser(v);
      if (u) return u;
    } catch {}
  }

  for (const k of COOKIE_KEYS) {
    const v = readCookie(k);
    const u = tryParseUser(v);
    if (u) return u;
  }

  return null;
}

function persistLocalUser(u: AuthUser) {
  try {
    window.localStorage.setItem("kstay_user", JSON.stringify(u));
    window.localStorage.setItem("kstay_logged_in", "1");
  } catch {}
  setCookie("kstay_user", JSON.stringify(u));
  setCookie("kstay_logged_in", "1");
}

function clearLocalUser() {
  try {
    window.localStorage.removeItem("kstay_user");
    window.localStorage.removeItem("kstay_logged_in");
    window.localStorage.removeItem("kst_user");
    window.localStorage.removeItem("kst_logged_in");
  } catch {}
  clearCookie("kstay_user");
  clearCookie("kstay_logged_in");
  clearCookie("kst_user");
  clearCookie("kst_logged_in");
}

export default function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);

  useEffect(() => {
    const u = detectClientUser();
    if (u) queueMicrotask(() => setUser(u));
  }, []);

  const signInDemo = useCallback(() => {
    const u: AuthUser = { id: "demo-guest", name: "Guest", role: "GUEST" };
    setUser(u);
    persistLocalUser(u);
    router.refresh();
  }, [router]);

  const signOutLocal = useCallback(() => {
    setUser(null);
    clearLocalUser();
    router.refresh();
  }, [router]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthed: !!user,
      signInDemo,
      signOutLocal,
    }),
    [user, signInDemo, signOutLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
}

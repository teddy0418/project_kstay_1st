"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "GUEST" | "HOST" | "ADMIN";
export type AuthUser = { id: string; name: string; role: UserRole };

type AuthCtx = {
  user: AuthUser | null;
  isAuthed: boolean;
  signInDemo: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

const LS_CANDIDATES = [
  "kstay_user",
  "kstay_session",
  "kstay_auth",
  "kstay_logged_in",
  "kst_user",
  "kst_session",
];

const COOKIE_CANDIDATES = [
  "kstay_user",
  "kstay_session",
  "kstay_auth",
  "kstay_logged_in",
  "kst_user",
  "kst_session",
];

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

function tryParseUser(v: string): AuthUser | null {
  if (!v) return null;
  try {
    const obj = JSON.parse(v) as Record<string, unknown>;
    if (obj && typeof obj === "object") {
      const id = String(obj.id ?? "demo");
      const name = String(obj.name ?? "Guest");
      const role = obj.role === "HOST" || obj.role === "ADMIN" ? (obj.role as UserRole) : "GUEST";
      return { id, name, role };
    }
  } catch {}
  if (v === "1" || v === "true" || v === "yes" || v === "loggedin") {
    return { id: "demo-guest", name: "Guest", role: "GUEST" };
  }
  return null;
}

function detectUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  for (const k of LS_CANDIDATES) {
    try {
      const v = window.localStorage.getItem(k) || "";
      const u = tryParseUser(v);
      if (u) return u;
    } catch {}
  }

  for (const k of COOKIE_CANDIDATES) {
    const v = readCookie(k);
    const u = tryParseUser(v);
    if (u) return u;
  }

  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = detectUser();
    queueMicrotask(() => setUser(u));
  }, []);

  const signInDemo = () => {
    const u: AuthUser = { id: "demo-guest", name: "Guest", role: "GUEST" };
    setUser(u);
    try {
      window.localStorage.setItem("kstay_user", JSON.stringify(u));
      window.localStorage.setItem("kstay_logged_in", "1");
    } catch {}
    setCookie("kstay_logged_in", "1");
    setCookie("kstay_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    try {
      for (const k of LS_CANDIDATES) window.localStorage.removeItem(k);
      window.localStorage.removeItem("kstay_logged_in");
      window.localStorage.removeItem("kstay_user");
    } catch {}
    for (const k of COOKIE_CANDIDATES) clearCookie(k);
    clearCookie("kstay_logged_in");
    clearCookie("kstay_user");
  };

  const value = useMemo<AuthCtx>(() => {
    return { user, isAuthed: !!user, signInDemo, signOut };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
}


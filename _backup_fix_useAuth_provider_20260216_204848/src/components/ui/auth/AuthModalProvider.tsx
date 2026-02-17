"use client";

import React from "react";
import AuthModalProviderRoot, { useAuthModalOpen } from "@/components/ui/AuthModalProvider";
import type { Role } from "@/lib/auth/session";

type OpenArgs = { next?: string; role?: Role };

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  return <AuthModalProviderRoot>{children}</AuthModalProviderRoot>;
}

export function useAuthModal() {
  const ctx = useAuthModalOpen();
  const openAuth = (args?: OpenArgs) => {
    ctx.open({ next: args?.next ?? "/" });
  };
  return {
    isOpen: ctx.isOpen,
    openAuth,
    closeAuth: ctx.close,
    next: "/",
    role: "guest" as Role,
  };
}

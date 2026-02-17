"use client";

import React from "react";

import LanguageProvider, { Lang } from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

import AuthProvider, { type AuthUser } from "@/components/ui/AuthProvider";
import WishlistProvider from "@/components/ui/WishlistProvider";
import AuthModalProvider from "@/components/ui/auth/AuthModalProvider";

type Props = {
  children: React.ReactNode;
  initialLang?: Lang;
  initialUser?: AuthUser | null;
};

export default function Providers({ children, initialLang, initialUser }: Props) {
  return (
    <LanguageProvider initialLang={initialLang}>
      {/* ✅ AuthModalProvider 내부(AuthModal)가 useAuth()를 쓰므로 AuthProvider가 반드시 위에 있어야 함 */}
      <AuthProvider initialUser={initialUser}>
        <AuthModalProvider>
          <WishlistProvider>
            <CurrencyProvider>
              <ToastProvider>{children}</ToastProvider>
            </CurrencyProvider>
          </WishlistProvider>
        </AuthModalProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

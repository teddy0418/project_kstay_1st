"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import LanguageProvider, { Lang } from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

import AuthProvider from "@/components/ui/AuthProvider";
import AuthModalProvider from "@/components/ui/AuthModalProvider";
import WishlistProvider from "@/components/ui/WishlistProvider";

export default function Providers({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <SessionProvider>
        <AuthProvider>
          <AuthModalProvider>
            <WishlistProvider>
              <CurrencyProvider>
                <ToastProvider>{children}</ToastProvider>
              </CurrencyProvider>
            </WishlistProvider>
          </AuthModalProvider>
        </AuthProvider>
      </SessionProvider>
    </LanguageProvider>
  );
}

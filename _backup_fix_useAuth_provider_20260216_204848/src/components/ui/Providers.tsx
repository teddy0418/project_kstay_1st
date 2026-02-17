"use client";

import React from "react";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import LanguageProvider from "@/components/ui/LanguageProvider";
import { AuthModalProvider } from "@/components/ui/auth/AuthModalProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <ToastProvider>
          <AuthModalProvider>{children}</AuthModalProvider>
        </ToastProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

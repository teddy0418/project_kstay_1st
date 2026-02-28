"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import LanguageProvider, { Lang } from "@/components/ui/LanguageProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";
import { ExchangeRatesProvider } from "@/components/ui/ExchangeRatesProvider";
import GeoDetector from "@/components/ui/GeoDetector";
import type { Currency } from "@/lib/currency";
import { ToastProvider } from "@/components/ui/ToastProvider";

import AuthProvider from "@/components/ui/AuthProvider";
import AuthModalProvider from "@/components/ui/AuthModalProvider";
import WishlistProvider from "@/components/ui/WishlistProvider";

export default function Providers({
  children,
  initialLang,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
  initialCurrency?: Currency;
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
        <AuthProvider>
          <AuthModalProvider>
            <WishlistProvider>
              <CurrencyProvider initialCurrency={initialCurrency}>
                <ExchangeRatesProvider>
                  <GeoDetector />
                  <ToastProvider>{children}</ToastProvider>
                </ExchangeRatesProvider>
              </CurrencyProvider>
            </WishlistProvider>
          </AuthModalProvider>
        </AuthProvider>
      </SessionProvider>
    </LanguageProvider>
  );
}

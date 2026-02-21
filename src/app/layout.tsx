import "./globals.css";
import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import Providers from "@/components/ui/Providers";
import { geoCountryToLocale } from "@/lib/geo";

type Lang = "en" | "ko" | "ja" | "zh";
type Currency = "USD" | "KRW" | "JPY" | "CNY";

export const metadata: Metadata = {
  title: "KSTAY",
  description: "KSTAY — Best value stays in Korea (MVP)",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171717",
};

function normalizeLang(raw?: string): Lang {
  return raw === "ko" || raw === "ja" || raw === "zh" ? raw : "en";
}

function normalizeCurrency(raw?: string): Currency {
  if (raw === "KRW" || raw === "JPY" || raw === "CNY") return raw;
  return "USD";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const h = await headers();

  // 1. 수동 선택 우선 (쿠키)
  const langRaw = c.get("kstay_lang")?.value || c.get("kst_lang")?.value;
  const currencyRaw = c.get("kst_currency")?.value;

  let initialLang: Lang;
  let initialCurrency: Currency;

  if (langRaw) {
    initialLang = normalizeLang(langRaw);
  } else {
    // 2. IP 기반 자동 감지 (쿠키 없을 때만)
    const country = h.get("x-vercel-ip-country")?.trim();
    const geo = geoCountryToLocale(country);
    initialLang = geo.lang;
  }

  if (currencyRaw) {
    initialCurrency = normalizeCurrency(currencyRaw);
  } else {
    const country = h.get("x-vercel-ip-country")?.trim();
    const geo = geoCountryToLocale(country);
    initialCurrency = geo.currency;
  }

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Providers initialLang={initialLang} initialCurrency={initialCurrency}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

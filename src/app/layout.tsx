import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
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

const LAYOUT_INIT_TIMEOUT_MS = 3000;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let initialLang: Lang = "en";
  let initialCurrency: Currency = "USD";

  try {
    const [c, h] = await Promise.race([
      Promise.all([cookies(), headers()]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Layout init timeout")), LAYOUT_INIT_TIMEOUT_MS)
      ),
    ]);

    const langRaw = c.get("kstay_lang")?.value || c.get("kst_lang")?.value;
    const currencyRaw = c.get("kst_currency")?.value;

    if (langRaw) {
      initialLang = normalizeLang(langRaw);
    } else {
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
  } catch {
    // 타임아웃/오류 시 기본값으로 렌더링해 페이지가 멈추지 않게 함
  }

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 antialiased overflow-x-hidden">
        <Script
          src="https://cdn.portone.io/v2/browser-sdk.js"
          strategy="afterInteractive"
        />
        <Providers initialLang={initialLang} initialCurrency={initialCurrency}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

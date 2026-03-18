import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit } from "next/font/google";
import { cookies, headers } from "next/headers";
import Providers from "@/components/ui/Providers";
import { geoCountryToLocale } from "@/lib/geo";
import type { Currency } from "@/lib/currency";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const outfit = Outfit({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ader",
  display: "swap",
});

type Lang = "en" | "ko" | "ja" | "zh";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://kstay.co.kr";

export const metadata: Metadata = {
  title: { default: "KSTAY — Best Value Stays in Korea", template: "%s | KSTAY" },
  description:
    "Book affordable, quality accommodation in Korea. Apartments, guesthouses, and more across Seoul, Busan, Jeju and beyond.",
  keywords: [
    "Korea accommodation",
    "Seoul hotel",
    "Busan stay",
    "Jeju guesthouse",
    "한국 숙소",
    "한국 여행",
    "KSTAY",
  ],
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.svg",
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "KSTAY",
    title: "KSTAY — Best Value Stays in Korea",
    description: "Book affordable, quality accommodation in Korea.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "KSTAY — Best Value Stays in Korea",
    description: "Book affordable, quality accommodation in Korea.",
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
  if (raw && SUPPORTED_CURRENCIES.includes(raw as Currency)) return raw as Currency;
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
    <html lang={initialLang} suppressHydrationWarning className={outfit.variable}>
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

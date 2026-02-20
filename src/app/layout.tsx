import "./globals.css";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Providers from "@/components/ui/Providers";

type Lang = "en" | "ko" | "ja" | "zh";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const langRaw = c.get("kstay_lang")?.value || c.get("kst_lang")?.value;
  const initialLang = normalizeLang(langRaw);

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Providers initialLang={initialLang}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

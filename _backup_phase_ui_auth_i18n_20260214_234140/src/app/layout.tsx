import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CurrencyProvider } from "@/components/ui/CurrencyProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KSTAY | Best value stays in Korea",
  description:
    "A photo-first booking platform for international travelers — best value with transparent pricing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("[KSTAY:server] 1. RootLayout render");
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-neutral-900`}>
        <CurrencyProvider>
          <ToastProvider>{children}</ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}

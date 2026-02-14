# 1) Backup existing key files (safe)
$backupDir = Join-Path (Get-Location) ("_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$filesToBackup = @(
  "tailwind.config.ts",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx"
)

foreach ($f in $filesToBackup) {
  if (Test-Path $f) {
    $dest = Join-Path $backupDir $f
    $destParent = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $destParent | Out-Null
    Copy-Item -Force $f $dest
  }
}

# 2) Ensure folders exist
New-Item -ItemType Directory -Force -Path "src/lib","src/components/layout","src/components/ui" | Out-Null

# 3) Write tailwind.config.ts (with brand colors + shadows)
@'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          foreground: "hsl(var(--brand-foreground) / <alpha-value>)",
          soft: "hsl(var(--brand-soft) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.06)",
        elevated: "0 10px 30px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
'@ | Set-Content -Path "tailwind.config.ts" -Encoding utf8

# 4) Write globals.css (brand variables)
@'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* KSTAY Signature: Celadon Teal (change these to switch brand color globally) */
  --brand: 172 66% 42%;
  --brand-foreground: 0 0% 100%;
  --brand-soft: 172 66% 96%;
}

@layer base {
  html,
  body {
    @apply bg-white text-neutral-900 antialiased;
  }

  ::selection {
    background: hsl(var(--brand) / 0.25);
  }
}
'@ | Set-Content -Path "src/app/globals.css" -Encoding utf8

# 5) Write src/lib/utils.ts
@'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
'@ | Set-Content -Path "src/lib/utils.ts" -Encoding utf8

# 6) Write Container component
@'
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1760px] px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
'@ | Set-Content -Path "src/components/layout/Container.tsx" -Encoding utf8

# 7) Write SearchBar component
@'
import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="flex flex-1 justify-center">
      {/* Desktop */}
      <button
        type="button"
        className="hidden md:flex items-center rounded-full border border-neutral-200 bg-white shadow-soft hover:shadow-elevated transition px-2 py-2"
        aria-label="Search stays"
      >
        <span className="px-4 text-sm font-medium text-neutral-900">Anywhere</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="px-4 text-sm font-medium text-neutral-900">Any week</span>
        <span className="h-6 w-px bg-neutral-200" />
        <span className="pl-4 pr-2 text-sm text-neutral-600 flex items-center gap-2">
          Add guests
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Search className="h-4 w-4" />
          </span>
        </span>
      </button>

      {/* Mobile */}
      <button
        type="button"
        className="md:hidden w-full max-w-[520px] flex items-center gap-3 rounded-full border border-neutral-200 bg-white shadow-soft px-4 py-3"
        aria-label="Search stays"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
          <Search className="h-5 w-5 text-brand" />
        </span>
        <div className="text-left">
          <div className="text-sm font-semibold text-neutral-900">Search</div>
          <div className="text-xs text-neutral-600">Anywhere · Any week · Guests</div>
        </div>
      </button>
    </div>
  );
}
'@ | Set-Content -Path "src/components/ui/SearchBar.tsx" -Encoding utf8

# 8) Write Header component
@'
import Link from "next/link";
import { Globe, Menu, UserCircle2 } from "lucide-react";
import Container from "@/components/layout/Container";
import SearchBar from "@/components/ui/SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="flex h-[76px] items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-brand text-brand-foreground grid place-items-center font-semibold">
            K
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-sm font-semibold tracking-tight">KSTAY</div>
            <div className="text-xs text-neutral-500">Stay Korea, feel local</div>
          </div>
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden lg:inline-flex rounded-full px-4 py-2 text-sm font-medium hover:bg-neutral-100"
          >
            Become a host
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100"
            aria-label="Language"
            title="Language"
          >
            <Globe className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-soft hover:shadow-elevated transition"
            aria-label="Account menu"
          >
            <Menu className="h-5 w-5" />
            <UserCircle2 className="h-6 w-6 text-neutral-700" />
          </button>
        </div>
      </Container>
    </header>
  );
}
'@ | Set-Content -Path "src/components/layout/Header.tsx" -Encoding utf8

# 9) Write src/app/layout.tsx (attach Header)
@'
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KSTAY | Stay Korea, feel local",
  description: "A global booking platform for stays in Korea.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-neutral-900`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
'@ | Set-Content -Path "src/app/layout.tsx" -Encoding utf8

# 10) Write src/app/page.tsx (simple hero)
@'
import Container from "@/components/layout/Container";

export default function Page() {
  return (
    <>
      <section className="border-b border-neutral-200">
        <Container className="py-10">
          <h1 className="text-4xl font-semibold tracking-tight">
            Find your stay in <span className="text-brand">Korea</span>
          </h1>
          <p className="mt-3 text-neutral-600 max-w-2xl">
            Curated stays for international travelers — clear rules, easy check-in, and a local experience.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95">
              Explore stays
            </button>
            <button className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold hover:bg-neutral-50">
              Learn more
            </button>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm font-semibold">Next (Phase 2-2)</div>
          <div className="mt-1 text-sm text-neutral-600">
            Category pills + listing grid (Airbnb-style cards).
          </div>
        </div>
      </Container>
    </>
  );
}
'@ | Set-Content -Path "src/app/page.tsx" -Encoding utf8

# 11) Install UI dependencies (if not installed yet)
npm i lucide-react clsx tailwind-merge

Write-Host ""
Write-Host "Done. Backup saved to: $backupDir"
Write-Host "Now run: npm run dev"

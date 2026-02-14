# --- Backup (safe) ---
$backupDir = Join-Path (Get-Location) ("_backup_phase2_2_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$filesToBackup = @(
  "tailwind.config.ts",
  "next.config.mjs",
  "next.config.js",
  "src/app/page.tsx",
  "src/app/listings/[id]/page.tsx",
  "src/lib/mockData.ts",
  "src/lib/format.ts",
  "src/types/index.ts"
)

foreach ($f in $filesToBackup) {
  if (Test-Path $f) {
    $dest = Join-Path $backupDir $f
    $destParent = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $destParent | Out-Null
    Copy-Item -Force $f $dest
  }
}

# --- Ensure folders exist ---
New-Item -ItemType Directory -Force -Path `
  "src/types", `
  "src/lib", `
  "src/features/listings/components", `
  "src/features/search/components", `
  "src/app/listings/[id]" | Out-Null

# --- Tailwind config (add src/features scan) ---
@'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
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

# --- next.config (allow Unsplash for next/image) ---
if (Test-Path "next.config.mjs") {
  @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
'@ | Set-Content -Path "next.config.mjs" -Encoding utf8
} elseif (Test-Path "next.config.js") {
  @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

module.exports = nextConfig;
'@ | Set-Content -Path "next.config.js" -Encoding utf8
} else {
  @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
'@ | Set-Content -Path "next.config.mjs" -Encoding utf8
}

# --- types ---
@'
export type Listing = {
  id: string;
  title: string;
  location: string;       // e.g. "Seoul · Seongsu"
  startDate: string;      // "YYYY-MM-DD"
  endDate: string;        // "YYYY-MM-DD"
  pricePerNightKRW: number;
  rating: number;         // e.g. 4.89
  imageUrl: string;
  categories: string[];   // slugs
};

export type Category = {
  slug: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; // LucideIcon (kept simple for now)
};
'@ | Set-Content -Path "src/types/index.ts" -Encoding utf8

# --- formatters (timezone-safe date range + KRW) ---
@'
function parseISODateUTC(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function formatDateRange(startISO: string, endISO: string) {
  const start = parseISODateUTC(startISO);
  const end = parseISODateUTC(endISO);

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });

  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${monthFmt.format(start)} ${dayFmt.format(start)}–${dayFmt.format(end)}`;
  }
  return `${monthFmt.format(start)} ${dayFmt.format(start)} – ${monthFmt.format(end)} ${dayFmt.format(end)}`;
}

export function formatKRW(amount: number) {
  return `₩${new Intl.NumberFormat("en-US").format(amount)}`;
}
'@ | Set-Content -Path "src/lib/format.ts" -Encoding utf8

# --- mock data (English-first) ---
@'
import type { Category, Listing } from "@/types";
import {
  Flame,
  Building2,
  Home,
  Landmark,
  Waves,
  Mountain,
  Trees,
  Sparkles,
  Castle,
  Plane,
} from "lucide-react";

export const categories: Category[] = [
  { slug: "trending", label: "Trending", icon: Flame },
  { slug: "apartments", label: "Apartments", icon: Building2 },
  { slug: "homes", label: "Homes", icon: Home },
  { slug: "hanok", label: "Hanok", icon: Landmark },
  { slug: "ocean", label: "Ocean view", icon: Waves },
  { slug: "mountain", label: "Mountain view", icon: Mountain },
  { slug: "nature", label: "Nature", icon: Trees },
  { slug: "premium", label: "Premium", icon: Sparkles },
  { slug: "unique", label: "Unique stays", icon: Castle },
  { slug: "airport", label: "Near airport", icon: Plane },
];

export const listings: Listing[] = [
  {
    id: "seoul-seongsu-studio",
    location: "Seoul · Seongsu",
    title: "Cozy studio near Seoul Forest (3 min walk)",
    startDate: "2026-02-18",
    endDate: "2026-02-23",
    pricePerNightKRW: 98000,
    rating: 4.89,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    categories: ["trending", "apartments"],
  },
  {
    id: "seoul-hongdae-loft",
    location: "Seoul · Hongdae",
    title: "Modern loft steps from Hongdae nightlife",
    startDate: "2026-02-20",
    endDate: "2026-02-25",
    pricePerNightKRW: 115000,
    rating: 4.76,
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    categories: ["trending", "apartments"],
  },
  {
    id: "seoul-bukchon-hanok",
    location: "Seoul · Bukchon",
    title: "Quiet Bukchon hanok with a private courtyard",
    startDate: "2026-03-02",
    endDate: "2026-03-07",
    pricePerNightKRW: 210000,
    rating: 4.93,
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80",
    categories: ["hanok", "premium"],
  },
  {
    id: "busan-haeundae-ocean",
    location: "Busan · Haeundae",
    title: "Panoramic ocean view — sunrise from bed",
    startDate: "2026-02-28",
    endDate: "2026-03-04",
    pricePerNightKRW: 145000,
    rating: 4.81,
    imageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    categories: ["ocean", "trending"],
  },
  {
    id: "jeju-aewol-stonehouse",
    location: "Jeju · Aewol",
    title: "Jeju stone house with warm wood interior",
    startDate: "2026-03-10",
    endDate: "2026-03-14",
    pricePerNightKRW: 175000,
    rating: 4.88,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80",
    categories: ["nature", "unique", "premium"],
  },
  {
    id: "gangneung-cozy-home",
    location: "Gangneung · Gyeongpo",
    title: "Cozy home near the beach (5 min walk)",
    startDate: "2026-02-22",
    endDate: "2026-02-26",
    pricePerNightKRW: 109000,
    rating: 4.72,
    imageUrl:
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80",
    categories: ["ocean", "homes"],
  },
  {
    id: "seoul-namsan-suite",
    location: "Seoul · Namsan",
    title: "Premium suite with Namsan view",
    startDate: "2026-03-01",
    endDate: "2026-03-05",
    pricePerNightKRW: 260000,
    rating: 4.95,
    imageUrl:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=80",
    categories: ["premium", "mountain"],
  },
  {
    id: "incheon-airport-stay",
    location: "Incheon · Near airport",
    title: "Perfect for transit — easy airport access",
    startDate: "2026-02-19",
    endDate: "2026-02-21",
    pricePerNightKRW: 89000,
    rating: 4.67,
    imageUrl:
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1600&q=80",
    categories: ["airport", "apartments"],
  },
];
'@ | Set-Content -Path "src/lib/mockData.ts" -Encoding utf8

# --- CategoryPills (sticky under header) ---
@'
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import { categories } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function CategoryPills() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "trending";

  return (
    <div className="sticky top-[76px] z-40 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container className="py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = c.slug === active;

            return (
              <Link
                key={c.slug}
                href={c.slug === "trending" ? "/" : `/?category=${c.slug}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-brand bg-brand/5 text-brand"
                    : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
'@ | Set-Content -Path "src/features/search/components/CategoryPills.tsx" -Encoding utf8

# --- ListingCard (Airbnb-style) ---
@'
import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { Listing } from "@/types";
import { formatDateRange, formatKRW } from "@/lib/format";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 33vw, 100vw"
        />

        {/* (Wishlist coming later) - visual only for now */}
        <div className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft">
          <Heart className="h-5 w-5 text-neutral-800" />
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-neutral-900 truncate">{listing.location}</div>
          <div className="mt-0.5 text-sm text-neutral-600 truncate">{listing.title}</div>
          <div className="mt-0.5 text-sm text-neutral-600">
            {formatDateRange(listing.startDate, listing.endDate)}
          </div>
          <div className="mt-1 text-sm text-neutral-900">
            <span className="font-semibold">{formatKRW(listing.pricePerNightKRW)}</span> / night
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-900">
          <Star className="h-4 w-4" />
          <span>{listing.rating.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}
'@ | Set-Content -Path "src/features/listings/components/ListingCard.tsx" -Encoding utf8

# --- Home page (category + grid) ---
@'
import Container from "@/components/layout/Container";
import CategoryPills from "@/features/search/components/CategoryPills";
import ListingCard from "@/features/listings/components/ListingCard";
import { listings } from "@/lib/mockData";

export default function Page({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const category = searchParams?.category ?? "trending";

  const filtered =
    category === "trending"
      ? listings
      : listings.filter((l) => l.categories.includes(category));

  const resultsLabel =
    category === "trending" ? "Popular stays" : `${filtered.length} stays`;

  return (
    <>
      <CategoryPills />

      <Container className="py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stays in Korea</h1>
            <p className="mt-1 text-sm text-neutral-600">
              English-first experience for international travelers — hosted by locals in Korea.
            </p>
          </div>

          <div className="hidden md:flex gap-2">
            <button className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
              Filters
            </button>
            <button className="rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
              Show map
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-neutral-600">
          <span>{resultsLabel}</span>
          <div className="flex gap-2">
            <button className="rounded-full border border-neutral-200 px-4 py-2 hover:bg-neutral-50">
              Sort
            </button>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </Container>
    </>
  );
}
'@ | Set-Content -Path "src/app/page.tsx" -Encoding utf8

# --- Listing detail page ---
@'
import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import Container from "@/components/layout/Container";
import { listings } from "@/lib/mockData";
import { formatDateRange, formatKRW } from "@/lib/format";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = listings.find((l) => l.id === params.id);
  if (!listing) return notFound();

  return (
    <Container className="py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{listing.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-1 text-neutral-900">
            <Star className="h-4 w-4" />
            <span className="font-medium">{listing.rating.toFixed(2)}</span>
          </span>
          <span>·</span>
          <span>{listing.location}</span>
          <span>·</span>
          <span>{formatDateRange(listing.startDate, listing.endDate)}</span>
        </div>
      </div>

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 900px, 100vw"
          priority
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="text-lg font-semibold">About this place</h2>
          <p className="mt-3 leading-7 text-neutral-700">
            This is a clean starting point for KSTAY listing pages. Next we will add:
            amenities, house rules, check-in guide, reviews, and a map — all written for international guests.
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-neutral-200 p-5">
            <div className="text-sm text-neutral-700">
              Guest-friendly: clear English house rules + easy check-in instructions
            </div>
            <div className="text-sm text-neutral-700">
              Local hosting: Korean hosts, globally understandable experience
            </div>
            <div className="text-sm text-neutral-700">
              Trust-first: verified photos & transparent policies (coming next)
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 shadow-soft">
          <div className="flex items-end justify-between">
            <div className="text-xl font-semibold">
              {formatKRW(listing.pricePerNightKRW)}
              <span className="text-sm font-normal text-neutral-600"> / night</span>
            </div>
            <div className="text-sm text-neutral-600">KRW</div>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-neutral-200 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Dates</span>
              <span className="text-neutral-900">{formatDateRange(listing.startDate, listing.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Guests</span>
              <span className="text-neutral-900">1–2 (placeholder)</span>
            </div>
          </div>

          <button className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95">
            Check availability
          </button>
          <p className="mt-3 text-xs text-neutral-500">
            Booking & payments will be connected in later phases.
          </p>
        </aside>
      </div>
    </Container>
  );
}
'@ | Set-Content -Path "src/app/listings/[id]/page.tsx" -Encoding utf8

# --- ensure deps (safe even if already installed) ---
npm i lucide-react clsx tailwind-merge

Write-Host ""
Write-Host "Phase 2-2 applied."
Write-Host "Backup saved to: $backupDir"
Write-Host "Now run: npm run dev"

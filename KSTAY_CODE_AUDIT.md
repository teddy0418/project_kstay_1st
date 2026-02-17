# KSTAY Code Audit
- generatedAt: 2026-02-16T07:10:29.373Z
- files scanned: 76

## 1) Files over 300 lines
- src/app/(guest)/listings/[id]/page.tsx (417 lines)
- src/components/layout/Header.tsx (308 lines)

## 2) "any" usage (top 40)
- src/types/index.ts: any
- src/types/index.ts: : any

## 3) console/debugger usage (top 40)
- src/app/(guest)/page.tsx: console.log
- src/components/layout/BottomNav.tsx: console.log
- src/components/layout/Container.tsx: console.log
- src/components/ui/CurrencyProvider.tsx: console.log
- src/components/ui/ToastProvider.tsx: console.log

## 4) Hex colors usage (top 40)
- src/features/host/layout/HostShell.tsx: #F9FAFB

## 5) <img> usage (top 40)
- src/app/(guest)/board/page.tsx: <img
- src/app/(guest)/board/[id]/page.tsx: <img
- src/app/(guest)/listings/[id]/page.tsx: <img
- src/app/(guest)/profile/page.tsx: <img
- src/features/home/components/PopularDestinations.tsx: <img
- src/features/listings/components/ListingCard.tsx: <img
- src/features/listings/components/ListingGallery.tsx: <img
- src/features/listings/components/ListingGallery.tsx: <img

## 6) Robustness pages
- src/app/not-found.tsx: ❌ MISSING
- src/app/error.tsx: ❌ MISSING

## Next recommended steps
- Replace 'any' with proper types in src/types and feature-level types.
- Replace hard-coded hex colors with design tokens (tailwind.config or CSS variables).
- Convert critical <img> to next/image when you start optimizing LCP.
- Add not-found.tsx and error.tsx if missing.

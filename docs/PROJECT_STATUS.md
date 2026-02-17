# PROJECT STATUS

Last updated: 2026-02-17

## Current Scope
- Guest booking flow (home, browse, listing detail, checkout, board, profile, wishlist, help).
- Host flow with approval states (`NONE` -> onboarding, `PENDING` -> pending, `APPROVED` -> dashboard/tabs).
- Auth is demo-mode (`signInDemo`) with modal-first UX.
- Wishlist is user-scoped and disabled for logged-out users.

## Runtime / Scripts
- Dev port: `3001` (`npm run dev` uses `next dev --webpack -p 3001`).
- Main checks:
  - `npm run build`
  - `npm run lint`
  - `npm run typecheck`

## Routing Notes
- Root providers are mounted once in `src/app/layout.tsx` via `src/components/ui/Providers.tsx`.
- 404/error UX:
  - `src/app/not-found.tsx`
  - `src/app/error.tsx`
- Fallback pages:
  - `/coming-soon`
  - `/help`

## Auth / Logout Status
- Canonical logout route: `/logout`.
- Compatibility redirects:
  - `/auth/logout` -> `/logout`
  - `/auth/signout` -> `/logout`
  - `/signout` -> `/logout`
- Login entry:
  - `/login` (modal-centric)
  - `/auth/login` redirects to `/login` (preserves `next` query when present).

## Host Policy State
- Cookie key: `kstay_host_listing_status` (`NONE | PENDING | APPROVED`).
- Routing:
  - `/host` -> onboarding/pending/dashboard by cookie status.
- Tabs are visible only when status is `APPROVED`.

## Known Non-Blocking Gaps
- Several lint warnings remain (`<img>` optimization and some hook-deps warnings).
- OAuth/real auth backend, payments, and settlement automation are placeholder/MVP.

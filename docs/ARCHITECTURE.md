# ARCHITECTURE

## App Router Layout
- Root: `src/app/layout.tsx` (server)
  - Reads cookies for initial language/user.
  - Mounts `Providers` once for the whole app.
- Guest shell: `src/app/(guest)/layout.tsx`
  - `Header` -> `FloatingSearch` -> page -> `BottomNav`.
- Host shell: `src/app/host/layout.tsx`
  - Reads host status cookie and only shows center tabs when `APPROVED`.

## Provider Chain (Single Source)
`LanguageProvider -> AuthProvider -> AuthModalProvider -> WishlistProvider -> CurrencyProvider -> ToastProvider`

File: `src/components/ui/Providers.tsx`

### Initial Hydration
- `initialLang` from cookies (`kstay_lang` / `kst_lang`).
- `initialUser` from cookies (`kstay_user` / `kst_user`).
- Passed from `src/app/layout.tsx` to `Providers`.

## Auth Flow
- `AuthProvider` manages user state using localStorage + cookie sync.
- `AuthModalProvider` opens global login modal and calls `signInDemo`.
- Login pages are modal-centric (`/login`), with `/auth/login` as redirect shim.
- Logout canonical route is `/logout`; alternate paths redirect there.

## Wishlist Flow
- `WishlistProvider` keeps wishlist per authenticated user key.
- Logged-out state always reads as empty.
- Heart action when logged-out opens auth modal (no page navigation).

## Host Approval Flow
- Utility: `src/lib/hostStatus.ts`
  - `HOST_STATUS_COOKIE = kstay_host_listing_status`
  - `normalizeHostStatus()`
- Routing:
  - `/host` -> `NONE:/host/onboarding`, `PENDING:/host/pending`, `APPROVED:/host/dashboard`
- `host/listings/new` sets `PENDING` on submit.
- Pending screen has demo button to set `APPROVED`.

## i18n / Currency
- `LanguageProvider` stores language in cookie + localStorage and calls `router.refresh()`.
- Root layout injects initial language from cookies to prevent reset on navigation/reload.
- `CurrencyProvider` keeps selected currency and formats display values.

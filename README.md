# KSTAY

> **Best value stays in Korea** — 글로벌 타겟 한국 숙소 예약 플랫폼

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| Database | PostgreSQL + Prisma 7 |
| Auth | NextAuth v4 (Google, Kakao, LINE, Facebook) |
| Payments | PortOne (Toss / Eximbay) |
| i18n | ko / en / ja / zh |
| Maps | Leaflet + react-leaflet |
| Email | Resend + React Email |
| PWA | Serwist |
| Deploy | Vercel |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Copy .env.example to .env.local and fill in values
cp .env.example .env.local

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Start dev server (http://localhost:3001)
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 (port 3001) |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run lint` | ESLint 검사 |
| `npm run check` | lint + typecheck + build 통합 검사 |
| `npx prisma studio` | DB GUI 브라우저 |
| `npx prisma migrate dev` | DB 마이그레이션 (개발) |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `CRON_SECRET` | Yes | Cron endpoint auth key (`openssl rand -hex 32`) |
| `KAKAO_CLIENT_ID` | No | Kakao login |
| `LINE_CLIENT_ID` / `LINE_CLIENT_SECRET` | No | LINE login |
| `PORTONE_API_SECRET` | No | PortOne payment API |
| `PORTONE_WEBHOOK_SECRET` | No | PortOne webhook signature verification |
| `RESEND_API_KEY` | No | Email sending |
| `ADMIN_EMAILS` | No | Comma-separated admin emails |

## Deployment (Vercel)

1. Vercel에 GitHub 레포 연결
2. Environment Variables에 위 필수 변수 모두 설정
3. `git push` → 자동 배포

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── (guest)/      # Guest-facing pages (home, listings, checkout, etc.)
│   ├── host/         # Host dashboard
│   ├── admin/        # Admin panel
│   └── api/          # API routes
├── components/       # Shared UI components (layout, auth, search, etc.)
├── features/         # Domain-specific components (listings, home, map, etc.)
├── lib/              # Utilities (auth, db, validation, i18n, policy, etc.)
├── emails/           # React Email templates
└── types/            # TypeScript type definitions
```

## Key Policies

| Policy | Value |
|--------|-------|
| Guest service fee | 12% (tax included) |
| Host fee | 0% |
| Free cancellation | Until 7 days before check-in (23:59 KST) |
| Host decision | 24h after payment to accept/reject |

## Documentation

Detailed docs are in the `docs/` folder:

- `HANDOVER.md` — Project handover document
- `docs/ARCHITECTURE.md` — Architecture overview
- `docs/CONVENTIONS.md` — Code conventions
- `docs/PORTONE_PAYMENT_FLOW.md` — Payment integration flow
- `docs/DEPLOY_ORDER.md` — Deployment guide

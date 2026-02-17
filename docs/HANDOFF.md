# KSTAY Project Handoff (Shareable)
Last updated: 2026-02-14 (KST)

This document is designed to be shared as-is with another AI or team member.

---

## 0) One-line Definition
**KSTAY** is a photo-first accommodation booking platform for international travelers in Korea.  
We charge **10% guest service fee** and **0% host fee**, protecting Korean hosts and delivering best-value stays with transparent pricing.

---

## 1) Quick Start (Local Dev)

### Requirements
- Node.js: recommended LTS (18/20)
- Package manager: npm

### Install & Run
```bash
npm install
npm run dev
```

- Default: **http://localhost:3000**. If the port is in use, Next.js will use the next available (e.g. 3001, 3002).
- To force a port: `npm run dev -- -p 3001`

### Build & Start (Production)
```bash
npm run build
npm run start
```

---

## 2) Key Docs in This Repo
- **`PROJECT_STATUS.md`** (root) — Implemented features, file structure, policies (fees, cancellation, KST, settlement), and **Next Steps** priority. Use this for a full brief.

---

## 3) Stack & Conventions
- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Turbopack.
- **Layout:** Central max-width `Container` (max-w-[1200px]), guest layout = Header + FloatingSearch (Suspense) + BottomNav.
- **Images:** Plain `<img>` (no `next/image`) to avoid 500s; local SVGs under `public/destinations/`.
- **Policies:** See `src/lib/policy.ts` (guest 10%, host 0%, 7-day free cancellation KST, 24h host decline).

---

*Share this file together with `PROJECT_STATUS.md` for a complete handoff.*

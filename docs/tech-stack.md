# Tech Stack — Rationale

> **Project:** NSLRMP — NSL-DEL-restaurant-management-pwa  
> **Source:** AFI-44

Every library and provider choice is documented here with its rationale and the alternatives considered.

---

## Framework — Next.js 14 (App Router)

**Chosen:** Next.js 14 with App Router  
**Rationale:**
- Server Components reduce the JavaScript sent to staff/gestionnaire browsers — important for mobile 4G performance
- Built-in API Routes eliminate the need for a separate Express/Fastify backend
- Vercel is Next.js's native deployment platform — zero config, instant preview deployments
- App Router supports route groups `(gestionnaire)` and `(staff)` — clean separation of role-based layouts
- Specified by PO as the required framework for this project

**Alternatives considered:** Remix (less Vercel-native), Vite + Express (two separate codebases)

---

## Language — TypeScript

**Chosen:** TypeScript 5  
**Rationale:** Type-safe DB queries, Zod validation schemas shared between API and frontend, catches RBAC logic errors at compile time rather than runtime.

---

## Styling — Tailwind CSS

**Chosen:** Tailwind CSS 3  
**Rationale:**
- PO-specified for this project
- 3 explicit breakpoints required: 320px (mobile), 768px (tablet), 1280px (desktop) — Tailwind's `sm/md/lg` maps cleanly
- No runtime CSS-in-JS overhead — important for mobile PWA performance
- WCAG 2.1 AA compliance easier with explicit class-based focus/contrast utilities

**Alternatives considered:** Styled-components (runtime overhead), CSS Modules (verbose)

---

## Database — Neon PostgreSQL (EU region)

**Chosen:** Neon PostgreSQL via Vercel Marketplace  
**Rationale:**
- PO-mandated: EU region for GDPR data residency
- Serverless-native: scales to zero between requests — no idle cost for a single-restaurant app
- `@neondatabase/serverless` HTTP driver works on Vercel Edge Runtime (where `pg` TCP driver does not)
- Provisioned through Vercel Marketplace: `DATABASE_URL` injected automatically into Vercel env
- PostgreSQL's `CHECK` constraints enforce enum values at DB level (role, availability, channel, etc.)

**Alternatives considered:** PlanetScale MySQL (not EU by default), Supabase (more opinionated, heavier)

---

## Authentication — NextAuth.js v5

**Chosen:** NextAuth.js v5 (beta) with CredentialsProvider + JWT strategy  
**Rationale:**
- PO-specified as the required auth library
- JWT strategy allows storing `role` and `locale` in the token — no extra DB call per request in middleware
- CredentialsProvider is appropriate for email/password with bcrypt (no third-party OAuth needed at Phase 1)
- v5 is App Router-native — works seamlessly with Server Components and Edge middleware

**RBAC implementation:**
```typescript
// middleware.ts — Edge Runtime
export default auth((req) => {
  const role = req.auth?.user?.role
  if (req.nextUrl.pathname.startsWith('/finances') && role !== 'gestionnaire') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})
```
```typescript
// API Route — secondary guard
const session = await auth()
if (session?.user?.role !== 'gestionnaire') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Alternatives considered:** Clerk (external SaaS, GDPR complexity), Auth0 (cost, external dependency)

---

## Alerts — Brevo (WhatsApp Business API + Email)

**Chosen:** Brevo with `@getbrevo/brevo` Node.js SDK  
**Rationale:**
- PO-specified as the required provider
- Brevo is a certified Meta Business Solution Provider (BSP) — the only way to send WhatsApp Business messages in France legally
- Single SDK handles both WhatsApp Business API and transactional email — one integration, two channels
- 4 pre-approved Meta templates already exist: **A1_FR**, **A1_EN**, **A2_FR**, **A2_EN**

**Critical constraint:** Do NOT create new WhatsApp templates without Meta approval. Template IDs are hardcoded via env vars. Changing template content requires a new Meta review (1–7 business days).

**Alternatives considered:** Twilio (more expensive for WhatsApp in Europe), MessageBird (no combined email)

---

## Internationalization — next-intl

**Chosen:** next-intl 3  
**Rationale:**
- PO-specified as the required i18n library
- Best-in-class support for Next.js App Router (Server Components + Client Components)
- Language toggle without page reload using `useLocale()` hook
- Translation files: `messages/fr.json` (default), `messages/en.json`
- Locale persisted in `users.locale` DB column → loaded into JWT → available without DB calls

**Alternatives considered:** react-i18next (not App Router-native), next-i18next (Pages Router only)

---

## PWA — Web App Manifest + Service Worker

**Chosen:** Custom `manifest.json` + `sw.js` (with `next-pwa` as optional scaffolding helper)  
**Rationale:**
- PWA installability on iOS Safari 16+ and Android Chrome 110+ requires Web App Manifest
- Service Worker enables offline mode for opening checklist (NSLRMP-20) — useful when restaurant Wi-Fi is down
- `next-pwa` provides Workbox-based precaching with minimal config

**Cache strategy:**
- Static assets: CacheFirst
- API Routes: NetworkFirst (never cache financial data)
- Checklist task templates: StaleWhileRevalidate

---

## Data Visualization — Recharts

**Chosen:** Recharts 2  
**Rationale:**
- Pure React, works with Server/Client Components
- Responsive chart container built-in — adapts to 320px/768px/1280px breakpoints
- Required charts: bar chart (P&L monthly), line chart (cash flow), pie chart (gross margin by category)

**Alternatives considered:** Chart.js (imperative API, less React-idiomatic), Victory (heavier bundle)

---

## Hosting & CI/CD — Vercel

**Chosen:** Vercel  
**Rationale:**
- PO-specified as the deployment platform
- Neon PostgreSQL provisioned via Vercel Marketplace — `DATABASE_URL` injected automatically
- Preview deployment on every PR → gestionnaire can review features before production
- Vercel Cron Jobs handle daily/weekly alert triggers (no separate cron infrastructure needed)
- Edge Runtime for middleware.ts — RBAC check runs at the CDN edge, < 1ms latency

**Vercel Cron config (`vercel.json`):**
```json
{
  "crons": [
    { "path": "/api/alerts/trigger?type=daily_ca", "schedule": "0 5 * * *" },
    { "path": "/api/alerts/trigger?type=weekly_mb", "schedule": "0 7 * * 1" }
  ]
}
```
(UTC times — 05:00 UTC = 06:00 CET, 07:00 UTC = 08:00 CET)

---

## Input Validation — Zod

**Chosen:** Zod 3  
**Rationale:** Runtime type validation on all API Route inputs; schemas can be shared with TypeScript types via `z.infer<>`. Prevents SQL injection via parameterized binding + schema enforcement.

---

## Password Hashing — bcrypt

**Chosen:** `bcryptjs` (pure JS, no native deps)  
**Rationale:** Works on Vercel serverless without native bindings. saltRounds=12 gives ~200ms hash time on serverless — acceptable for login, not in hot paths.

---

## Summary Table

| Category | Library/Provider | Version | Specified by |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.x | PO |
| Language | TypeScript | 5.x | NSL standard |
| Styling | Tailwind CSS | 3.x | PO |
| Database | Neon PostgreSQL | latest | PO |
| DB client | @neondatabase/serverless | latest | Neon standard |
| Auth | NextAuth.js | v5 beta | PO |
| Alerts | @getbrevo/brevo | latest | PO |
| i18n | next-intl | 3.x | PO |
| Charts | Recharts | 2.x | Architect |
| Validation | Zod | 3.x | Architect |
| PWA | next-pwa + custom SW | latest | Architect |
| Hashing | bcryptjs | latest | Architect |
| Hosting | Vercel | — | PO |
| CI | GitHub Actions | — | NSL standard |

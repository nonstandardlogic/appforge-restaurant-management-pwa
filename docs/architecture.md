# Architecture — Restaurant Management PWA

> **Project:** NSLRMP — NSL-DEL-restaurant-management-pwa  
> **App name:** Le 8e Continent / Saveurs d'Ailleurs — Management PWA  
> **Source:** AFI-44  
> **Date:** 2026-06-12  
> **Architect:** NSL Architect Agent

---

## 1. System Overview

The Restaurant Management PWA is a bilingual (FR/EN) Progressive Web App serving **two distinct user roles** at a single restaurant (Montargis):

- **Gestionnaire** — full financial visibility: P&L, cash flow, gross margin, break-even, KPI alerts
- **Staff** — operational visibility only: HACCP logs, opening checklist, hours submission, operational dashboard

The system is structured as a **Next.js 14 App Router** application deployed on **Vercel**, backed by **Neon PostgreSQL** (EU region). Financial data is never sent to the client for the staff role — it is blocked at both the middleware and API layer. Real-time mobile alerts (WhatsApp + email) are delivered via **Brevo**, using 4 pre-approved Meta templates.

### Key design decisions

| Decision | Rationale |
|---|---|
| PWA over native app | Single codebase, no App Store friction, installable on iOS/Android, works offline for checklists |
| Next.js 14 App Router | Server Components reduce client JS bundle; built-in API Routes eliminate separate backend |
| Neon PostgreSQL | Serverless-native, Vercel Marketplace integration, EU region for GDPR compliance |
| Brevo for WhatsApp | Certified Meta BSP, pre-approved templates, combined WhatsApp + email with one SDK |
| JWT with role claim | Role enforcement at both Edge middleware and API Route level — defense in depth |
| next-intl | Best-in-class Next.js App Router i18n, no page reload on language toggle |

---

## 2. Tech Stack

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| i18n | next-intl | 3.x |
| PWA | next-pwa + custom Service Worker | latest |
| State (client) | React built-in (useState/useContext) — no Redux needed at Phase 1 scale | — |

### Backend (serverless via Next.js API Routes)

| Component | Technology |
|---|---|
| Runtime | Vercel Edge / Node.js serverless |
| Database client | `@neondatabase/serverless` (HTTP driver) |
| Auth | NextAuth.js v5 (beta) with CredentialsProvider |
| Session | JWT — role stored in token payload |
| Route protection | `middleware.ts` at Edge (matcher: `/finances/:path*`, `/api/financial/:path*`) |
| Alert delivery | `@getbrevo/brevo` Node.js SDK |

### Infrastructure

| Component | Choice |
|---|---|
| Hosting | Vercel (preview deployments on every PR, production on `main`) |
| Database | Neon PostgreSQL — EU Central region — provisioned via Vercel Marketplace |
| Domain | Custom via Vercel |
| CI/CD | GitHub Actions + Vercel automatic deployments |
| Secrets management | Vercel Environment Variables |
| Monitoring | Vercel Analytics + built-in logs |

---

## 3. Data Model

### Entity definitions

#### `users`
```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,             -- bcrypt, saltRounds=12
  role          TEXT NOT NULL CHECK (role IN ('gestionnaire','staff')),
  locale        TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr','en')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-8, NSLRMP-9, NSLRMP-10, NSLRMP-11, NSLRMP-33

#### `financial_records`
```sql
financial_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,             -- 'revenue','expense','pl','margin','cashflow'
  category      TEXT,                      -- PCG 82 account class or HCR category
  amount        NUMERIC(12,2) NOT NULL,
  tva_rate      NUMERIC(5,2),              -- 10.00 or 20.00
  period_month  INT NOT NULL,              -- 1–12
  period_year   INT NOT NULL,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-13, NSLRMP-14, NSLRMP-15, NSLRMP-16, NSLRMP-17

#### `haccp_logs`
```sql
haccp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date        DATE NOT NULL,
  location        TEXT NOT NULL,           -- 'cold_room','prep_area','dishwasher'
  temperature_c   NUMERIC(5,2) NOT NULL,
  is_compliant    BOOLEAN NOT NULL,        -- auto-computed: cold ≤ 4°C, hot ≥ 63°C
  notes           TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-19

#### `checklist_entries`
```sql
checklist_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date      DATE NOT NULL,
  task_key        TEXT NOT NULL,           -- maps to translation key in messages/
  is_done         BOOLEAN NOT NULL DEFAULT false,
  done_at         TIMESTAMPTZ,
  done_by         UUID REFERENCES users(id)
)
```
Covers: NSLRMP-20

#### `staff_hours`
```sql
staff_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID NOT NULL REFERENCES users(id),
  week_start      DATE NOT NULL,           -- Monday of the week (ISO 8601)
  day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  availability    TEXT NOT NULL CHECK (availability IN ('DISPO','REPOS')),
  time_slot_start TIME,
  time_slot_end   TIME,
  validated       BOOLEAN NOT NULL DEFAULT false,
  validated_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-21, NSLRMP-22

#### `alerts_config`
```sql
alerts_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      TEXT NOT NULL UNIQUE,    -- 'daily_ca','weekly_mb'
  threshold       NUMERIC(12,2),
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'fr',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-29

#### `alerts_log`
```sql
alerts_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      TEXT NOT NULL,
  template_id     TEXT NOT NULL,           -- A1_FR, A1_EN, A2_FR, A2_EN
  channel         TEXT NOT NULL CHECK (channel IN ('whatsapp','email')),
  status          TEXT NOT NULL CHECK (status IN ('sent','failed','retrying')),
  attempt         INT NOT NULL DEFAULT 1,
  payload         JSONB,
  brevo_message_id TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ DEFAULT now()
)
```
Covers: NSLRMP-30

### Entity relationships

```
users ──┬── financial_records (created_by)
        ├── haccp_logs (recorded_by)
        ├── checklist_entries (done_by)
        ├── staff_hours (staff_id, validated_by)
        └── alerts_config (locale drives template selection)
```

---

## 4. API Design

All endpoints are Next.js API Routes (`app/api/…/route.ts`). Role enforcement is applied at two levels:
1. **Edge middleware** (`middleware.ts`) — blocks `/finances/*` and `/api/financial/*` for non-gestionnaire sessions before the request reaches the handler.
2. **Route handler** — secondary check using `session?.user?.role === 'gestionnaire'` (returns 403 if bypassed).

### Auth endpoints

| Method | Path | Description | Stories |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | NextAuth.js handler (login, session) | NSLRMP-8, NSLRMP-25 |
| POST | `/api/users` | Create user (gestionnaire only) | NSLRMP-11 |
| PATCH | `/api/users/[id]` | Update role / reset password | NSLRMP-11 |
| GET | `/api/users` | List users (gestionnaire only) | NSLRMP-12 |

### Financial endpoints (gestionnaire only)

| Method | Path | Description | Stories |
|---|---|---|---|
| GET | `/api/financial/kpis` | CA, trésorerie, MB%, seuil alerts | NSLRMP-13 |
| GET/POST | `/api/financial/pl` | Monthly P&L (PCG 82) | NSLRMP-14 |
| GET/POST | `/api/financial/break-even` | Break-even calculation (CCN HCR) | NSLRMP-15 |
| GET/POST | `/api/financial/margin` | Gross margin % (5 categories) | NSLRMP-16 |
| GET/POST | `/api/financial/cashflow` | Cash flow weekly/monthly (TVA CA3) | NSLRMP-17 |

### Operational endpoints

| Method | Path | Description | Stories |
|---|---|---|---|
| GET/POST | `/api/haccp` | HACCP log CRUD | NSLRMP-19 |
| GET/POST | `/api/checklist` | Opening checklist tasks | NSLRMP-20 |
| GET/POST | `/api/staff/hours` | Weekly hours submission | NSLRMP-21 |
| GET/PATCH | `/api/staff/planning` | Planning grid + validation | NSLRMP-22 |

### Alert endpoints

| Method | Path | Description | Stories |
|---|---|---|---|
| GET/PUT | `/api/alerts/config` | Alert thresholds configuration | NSLRMP-29 |
| GET | `/api/alerts/log` | Alert delivery history | NSLRMP-30 |
| POST | `/api/alerts/trigger` | Internal: Vercel Cron trigger | NSLRMP-27, NSLRMP-28 |

### i18n endpoint

| Method | Path | Description | Stories |
|---|---|---|---|
| PATCH | `/api/users/me/locale` | Persist locale preference | NSLRMP-33 |

---

## 5. Third-Party Integrations

### NextAuth.js v5 — Authentication & session
- **Purpose:** Email/password login, JWT session with `role` claim, CSRF protection
- **Library:** `next-auth@5` (beta)
- **Config:** `lib/auth/config.ts` — CredentialsProvider with bcrypt password check; `session.strategy = 'jwt'`; JWT callback injects `user.role` and `user.locale`
- **Stories:** NSLRMP-8, NSLRMP-9, NSLRMP-25

### Neon PostgreSQL — Database
- **Purpose:** Persistent store for all application data (EU region, GDPR)
- **Library:** `@neondatabase/serverless` — HTTP driver compatible with Vercel Edge Runtime
- **Connection:** `DATABASE_URL` env var (pooler endpoint)
- **Stories:** NSLRMP-23

### Brevo — WhatsApp Business API + Email
- **Purpose:** Real-time daily CA alert (F5) and weekly MB% alert (F6)
- **Library:** `@getbrevo/brevo` Node.js SDK
- **Templates:** 4 pre-approved Meta templates — **A1_FR**, **A1_EN** (daily CA), **A2_FR**, **A2_EN** (weekly MB%)
- **CRITICAL:** Never create new WhatsApp templates without prior Meta approval. Template IDs are stored in Vercel env vars (`BREVO_TEMPLATE_A1_FR`, etc.)
- **Retry:** 3 attempts, exponential backoff (1s → 2s → 4s), result logged to `alerts_log`
- **Stories:** NSLRMP-27, NSLRMP-28, NSLRMP-29, NSLRMP-30

### next-intl — Internationalization
- **Purpose:** FR/EN bilingual UI without page reload; locale persisted per user in DB
- **Library:** `next-intl@3`
- **Default locale:** `fr`
- **Files:** `messages/fr.json`, `messages/en.json`
- **Locale storage:** `users.locale` column — fetched on login, stored in JWT payload
- **Stories:** NSLRMP-31, NSLRMP-32, NSLRMP-33

### Vercel Cron Jobs
- **Purpose:** Schedule daily CA alert (06:00 CET) and weekly MB% alert (Monday 08:00 CET)
- **Config:** `vercel.json` crons section
- **Endpoint:** `POST /api/alerts/trigger`
- **Stories:** NSLRMP-27, NSLRMP-28

### Recharts — Data visualization
- **Purpose:** KPI charts on financial dashboard (P&L bars, cash flow line, margin pie)
- **Library:** `recharts@2`
- **Stories:** NSLRMP-13, NSLRMP-14, NSLRMP-17

### next-pwa / Service Worker
- **Purpose:** PWA installability on iOS Safari 16+ and Android Chrome 110+; offline checklist access
- **Config:** `public/manifest.json`, `public/sw.js`
- **Stories:** NSLRMP-34

---

## 6. Security Considerations

### Authentication
- Passwords stored as bcrypt hashes (saltRounds=12), never in plaintext
- JWT signed with `NEXTAUTH_SECRET` (256-bit random, rotated per environment)
- Sessions expire after 8 hours; refresh on activity

### RBAC — Defense in depth

```
Request → Edge middleware.ts
            └── Check JWT role claim
                  ├── role === 'gestionnaire' → allow /finances/*, /api/financial/*
                  └── role === 'staff' OR missing → 403 / redirect to /dashboard
                        ↓
                  API Route handler
                  └── Secondary role check: session?.user?.role === 'gestionnaire'
                        └── Financial data rendered conditionally in React
                            (NOT hidden with CSS — component not mounted for staff)
```

**Critical:** Financial KPI components are conditionally rendered with `{role === 'gestionnaire' && <FinancialKPIs />}`, not `className="hidden"`. This ensures no financial data is ever included in the HTML sent to staff browsers.

### Data storage
- Neon PostgreSQL — EU Central region — data residency within EU for GDPR
- No financial data stored in browser localStorage or IndexedDB
- Service Worker caches only static assets and checklist templates (no sensitive data)

### PII handling
- User email addresses are the only PII stored
- `alerts_config` stores phone/email for alert delivery — access restricted to gestionnaire API
- Alert logs contain no financial values, only metadata (type, template ID, status)

### API security
- All mutation endpoints require valid JWT session (enforced by NextAuth middleware)
- Rate limiting via Vercel Edge Config (planned Phase 2)
- Input validation with Zod on all API Route handlers
- SQL queries use parameterized statements via `@neondatabase/serverless`

---

## 7. Scalability Notes

### Expected load (Phase 1)
- **Users:** 2–5 concurrent (1 gestionnaire, 2–4 staff)
- **Database:** < 10,000 rows across all tables per year
- **Alerts:** 2 cron jobs/day max

At this scale, Vercel serverless + Neon serverless PostgreSQL is comfortably over-provisioned. No additional scaling work is needed for Phase 1.

### Scaling path (Phase 2+)
- **Multi-restaurant:** Add `restaurant_id` foreign key to all tables; update JWT to include `restaurant_id`
- **Higher load:** Switch Neon driver from HTTP to WebSocket (connection pooling via PgBouncer)
- **Alert volume:** Brevo handles millions of messages/month; no changes needed
- **Analytics:** Add Vercel Analytics + custom event tracking for feature usage

---

## 8. Implementation Order (Epic Priority)

The recommended sequence follows dependency order and business value:

### Sprint 1 — Foundation (Weeks 1–2)
**NSLRMP-4 — Database & Backend Infrastructure**
- Stories: NSLRMP-23, NSLRMP-24, NSLRMP-25, NSLRMP-26
- Deliverables: Neon schema + migrations, NextAuth config, Vercel CI/CD pipeline
- This epic is a prerequisite for all others

### Sprint 2 — Core Auth & Security (Weeks 2–3)
**NSLRMP-1 — Authentication, RBAC & User Management**
- Stories: NSLRMP-8, NSLRMP-9, NSLRMP-10, NSLRMP-11, NSLRMP-12
- Deliverables: Login screen (S1), middleware RBAC, user management (S8, S9)

### Sprint 3 — Gestionnaire Dashboard (Weeks 3–5)
**NSLRMP-2 — Gestionnaire Financial Dashboard & KPIs**
- Stories: NSLRMP-13, NSLRMP-14, NSLRMP-15, NSLRMP-16, NSLRMP-17
- Deliverables: KPI cards (S2a), P&L (S3), margin calculator (S4), break-even, cash flow

### Sprint 4 — Staff Operations (Weeks 5–6)
**NSLRMP-3 — Staff Operational Dashboard & Compliance**
- Stories: NSLRMP-18, NSLRMP-19, NSLRMP-20, NSLRMP-21, NSLRMP-22
- Deliverables: Staff dashboard (S2b), HACCP (S5), checklist (S6), planning (S7), hours (S10)

### Sprint 5 — Differentiator Feature (Week 7)
**NSLRMP-5 — Alerting System — WhatsApp & Email (Brevo)**
- Stories: NSLRMP-27, NSLRMP-28, NSLRMP-29, NSLRMP-30
- Deliverables: Daily CA alert, weekly MB% alert, threshold config, delivery logging

### Sprint 6 — Polish (Weeks 7–8)
**NSLRMP-6 — Internationalization FR/EN (next-intl)**
- Stories: NSLRMP-31, NSLRMP-32, NSLRMP-33
- Deliverables: Language toggle, translation files, locale persistence

**NSLRMP-7 — PWA Shell, Responsive Design & Accessibility**
- Stories: NSLRMP-34, NSLRMP-35, NSLRMP-36
- Deliverables: PWA manifest + Service Worker, Tailwind breakpoints, WCAG 2.1 AA audit

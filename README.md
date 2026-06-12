# Restaurant Management PWA — Le 8e Continent / Saveurs d'Ailleurs

> **Delivery project:** NSLRMP — NSL-DEL-restaurant-management-pwa  
> **Source idea:** AFI-44 — [Phase 1] Restaurant Management PWA (Montargis)  
> **Jira board:** https://nonstandardlogic.atlassian.net/jira/software/projects/NSLRMP/boards  
> **Status:** Architecture scaffold — ready for development

A Progressive Web App for restaurant management designed for **Le 8e Continent / Saveurs d'Ailleurs** (Montargis). It delivers financial KPIs, operational compliance tracking, staff scheduling, and real-time WhatsApp/email alerts — all in a bilingual (FR/EN) PWA installable on iOS and Android.

---

## Tech Stack at a Glance

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL (EU region, Vercel Marketplace) |
| Auth | NextAuth.js v5 (JWT, role in payload) |
| i18n | next-intl (FR default) |
| Alerts | Brevo (WhatsApp Business API + Email) |
| Hosting | Vercel (preview + production) |
| CI/CD | Vercel + GitHub Actions |

---

## Project Structure

```
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login screen — S1
│   ├── (gestionnaire)/         # Gestionnaire-only routes
│   │   ├── dashboard/          # S2a — KPI cards
│   │   ├── finances/           # S3 (P&L), S4 (Gross margin)
│   │   ├── cashflow/           # Cash flow tracker
│   │   ├── break-even/         # Break-even calculator
│   │   ├── planning/           # S7 — Team planning grid
│   │   ├── users/              # S9 — User management
│   │   └── permissions/        # S8 — RBAC matrix
│   ├── (staff)/                # Staff-only routes
│   │   ├── dashboard/          # S2b — Operational dashboard
│   │   ├── haccp/              # S5 — HACCP temperature logs
│   │   ├── checklist/          # S6 — Opening checklist
│   │   └── hours/              # S10 — Weekly hours submission
│   └── api/                    # Next.js API Routes
│       ├── auth/               # NextAuth.js endpoints
│       ├── financial/          # Financial data endpoints
│       ├── haccp/              # HACCP log endpoints
│       ├── staff/              # Staff hour submission endpoints
│       ├── alerts/             # Alert config + delivery
│       └── users/              # User management endpoints
├── components/                 # Shared React components
│   ├── ui/                     # Primitives (Button, Card, Badge…)
│   ├── charts/                 # KPI charts (Recharts)
│   ├── forms/                  # Reusable form components
│   └── layout/                 # Shell, Nav, Header
├── lib/                        # Server-side utilities
│   ├── db/                     # Neon PostgreSQL client + queries
│   ├── auth/                   # NextAuth config & helpers
│   ├── brevo/                  # Brevo WhatsApp + Email client
│   └── utils/                  # French accounting helpers (PCG 82, HCR)
├── middleware.ts                # RBAC route protection (/finances/*)
├── messages/                   # next-intl translation files
│   ├── fr.json
│   └── en.json
├── public/                     # Static assets
│   ├── manifest.json           # PWA Web App Manifest
│   └── sw.js                   # Service Worker
├── docs/                       # Architecture documentation
├── .github/workflows/          # CI pipeline
└── prisma/                     # (Optional) schema reference
```

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm 9+
- Vercel CLI (`npm i -g vercel`)
- Neon PostgreSQL database (EU region) provisioned via Vercel Marketplace
- Brevo account with WhatsApp Business API approved templates

### 1. Clone & install

```bash
git clone https://github.com/nonstandardlogic/appforge-restaurant-management-pwa.git
cd appforge-restaurant-management-pwa
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://...@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Brevo
BREVO_API_KEY=xkeysib-...
BREVO_WHATSAPP_SENDER=+33...
BREVO_TEMPLATE_A1_FR=<template_id>
BREVO_TEMPLATE_A1_EN=<template_id>
BREVO_TEMPLATE_A2_FR=<template_id>
BREVO_TEMPLATE_A2_EN=<template_id>
```

### 3. Database migration

```bash
pnpm db:migrate   # runs SQL migration scripts in db/migrations/
```

### 4. Run locally

```bash
pnpm dev          # http://localhost:3000
```

### 5. Deploy to Vercel

```bash
vercel --prod
```

---

## Links

- **Jira board:** https://nonstandardlogic.atlassian.net/jira/software/projects/NSLRMP/boards
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **Tech stack rationale:** [docs/tech-stack.md](docs/tech-stack.md)
- **Feature → Story mapping:** [docs/features.md](docs/features.md)
- **Architecture diagram:** [docs/architecture-diagram.mmd](docs/architecture-diagram.mmd)

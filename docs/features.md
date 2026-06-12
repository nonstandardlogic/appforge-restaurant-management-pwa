# Features — Jira Story Cross-Reference

> **Project:** NSLRMP — NSL-DEL-restaurant-management-pwa  
> **Source:** AFI-44 — [Phase 1] Restaurant Management PWA

Each feature (F1–F9) and screen (S1–S10) maps to one or more Jira Stories in the NSLRMP project.

---

## Epic 1 — Authentication, RBAC & User Management
**NSLRMP-1** | Priority: 1 (security foundation)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-8](https://nonstandardlogic.atlassian.net/browse/NSLRMP-8) | Login screen with email/password authentication | S1 — Connexion | NextAuth.js CredentialsProvider |
| [NSLRMP-9](https://nonstandardlogic.atlassian.net/browse/NSLRMP-9) | RBAC enforcement at middleware and API Route level | — | `middleware.ts` + API double-guard |
| [NSLRMP-10](https://nonstandardlogic.atlassian.net/browse/NSLRMP-10) | Staff role — restricted dashboard with no financial data exposure | — | Conditional render, NOT CSS hide |
| [NSLRMP-11](https://nonstandardlogic.atlassian.net/browse/NSLRMP-11) | User account creation, role assignment and password reset | F8, S9 — Gestion utilisateurs | Gestionnaire only |
| [NSLRMP-12](https://nonstandardlogic.atlassian.net/browse/NSLRMP-12) | RBAC permissions matrix screen | S8 — Matrice permissions | Read-only display for gestionnaire |

---

## Epic 2 — Gestionnaire Financial Dashboard & KPIs
**NSLRMP-2** | Priority: 2 (primary gestionnaire value)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-13](https://nonstandardlogic.atlassian.net/browse/NSLRMP-13) | Gestionnaire dashboard KPI cards — CA, trésorerie, MB%, alerte seuil | S2a — Dashboard KPIs | Real-time from DB |
| [NSLRMP-14](https://nonstandardlogic.atlassian.net/browse/NSLRMP-14) | Monthly P&L dashboard aligned with French PCG 82 | F2, S3 — Compte de résultat | TVA 10%/20% separated |
| [NSLRMP-15](https://nonstandardlogic.atlassian.net/browse/NSLRMP-15) | Break-even calculator adapted for CCN HCR 39h/week | F1 — Seuil de rentabilité | HCR collective agreement |
| [NSLRMP-16](https://nonstandardlogic.atlassian.net/browse/NSLRMP-16) | Gross margin % calculator — 5 product categories, real inventory method | F3, S4 — Marge brute | 5 categories × real inventory |
| [NSLRMP-17](https://nonstandardlogic.atlassian.net/browse/NSLRMP-17) | Cash flow tracker — weekly/monthly view with TVA CA3 integration | F4 — Trésorerie | TVA CA3 quarterly declaration |

---

## Epic 3 — Staff Operational Dashboard & Compliance
**NSLRMP-3** | Priority: 3 (primary staff value)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-18](https://nonstandardlogic.atlassian.net/browse/NSLRMP-18) | Staff operational dashboard — checklist, HACCP alerts, stock alerts | S2b — Dashboard staff | No financial data |
| [NSLRMP-19](https://nonstandardlogic.atlassian.net/browse/NSLRMP-19) | HACCP daily temperature log and traceability records | S5 — Registre HACCP | ISO 22000 compliant |
| [NSLRMP-20](https://nonstandardlogic.atlassian.net/browse/NSLRMP-20) | Opening checklist — daily task completion tracking | S6 — Checklist ouverture | Offline-capable via SW |
| [NSLRMP-21](https://nonstandardlogic.atlassian.net/browse/NSLRMP-21) | Staff weekly hours submission — DISPO/REPOS toggle with time slots | F9, S10 — Planning semaine | Mon–Sun, DISPO/REPOS toggle |
| [NSLRMP-22](https://nonstandardlogic.atlassian.net/browse/NSLRMP-22) | Team planning grid — gestionnaire validation of staff schedules | S7 — Planning équipe | Gestionnaire validates |

---

## Epic 4 — Database & Backend Infrastructure
**NSLRMP-4** | Priority: 0 (prerequisite for all epics — deliver first)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-23](https://nonstandardlogic.atlassian.net/browse/NSLRMP-23) | Neon PostgreSQL schema — EU region, all tables, migration scripts | — | 7 tables, SQL migrations |
| [NSLRMP-24](https://nonstandardlogic.atlassian.net/browse/NSLRMP-24) | Next.js API Routes with role-based authorization guard | — | Zod validation on all routes |
| [NSLRMP-25](https://nonstandardlogic.atlassian.net/browse/NSLRMP-25) | NextAuth.js configuration — JWT session with role in token payload | — | role + locale in JWT |
| [NSLRMP-26](https://nonstandardlogic.atlassian.net/browse/NSLRMP-26) | Vercel deployment pipeline — CI/CD with automatic preview and production deploys | — | Preview on PR, prod on main |

---

## Epic 5 — Alerting System — WhatsApp & Email (Brevo)
**NSLRMP-5** | Priority: 4 (key differentiator)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-27](https://nonstandardlogic.atlassian.net/browse/NSLRMP-27) | Daily CA alert via WhatsApp Business + Email using Brevo | F5 — Alerte CA quotidien | Template A1_FR / A1_EN |
| [NSLRMP-28](https://nonstandardlogic.atlassian.net/browse/NSLRMP-28) | Weekly MB% alert via WhatsApp + Email with deduplication | F6 — Alerte MB% hebdo | Template A2_FR / A2_EN |
| [NSLRMP-29](https://nonstandardlogic.atlassian.net/browse/NSLRMP-29) | Alert threshold configuration per alert type | — | Gestionnaire configures |
| [NSLRMP-30](https://nonstandardlogic.atlassian.net/browse/NSLRMP-30) | Alert delivery logging with retry logic (3 attempts, exponential backoff) | — | Logged to alerts_log |

---

## Epic 6 — Internationalization FR/EN (next-intl)
**NSLRMP-6** | Priority: 5 (polish)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-31](https://nonstandardlogic.atlassian.net/browse/NSLRMP-31) | FR/EN language toggle without page reload | F7 — i18n | next-intl locale switch |
| [NSLRMP-32](https://nonstandardlogic.atlassian.net/browse/NSLRMP-32) | next-intl translation files — messages/fr.json and messages/en.json covering all screens | — | All 11 screens covered |
| [NSLRMP-33](https://nonstandardlogic.atlassian.net/browse/NSLRMP-33) | Locale preference persisted per user in Neon DB | — | users.locale column |

---

## Epic 7 — PWA Shell, Responsive Design & Accessibility
**NSLRMP-7** | Priority: 5 (polish, parallel with Epic 6)

| Story | Title | Feature/Screen | Notes |
|---|---|---|---|
| [NSLRMP-34](https://nonstandardlogic.atlassian.net/browse/NSLRMP-34) | PWA installation — Web App Manifest + Service Worker for iOS and Android | — | iOS Safari 16+, Android Chrome 110+ |
| [NSLRMP-35](https://nonstandardlogic.atlassian.net/browse/NSLRMP-35) | Responsive layout — Tailwind CSS at 3 breakpoints | — | 320px / 768px / 1280px |
| [NSLRMP-36](https://nonstandardlogic.atlassian.net/browse/NSLRMP-36) | WCAG 2.1 AA accessibility compliance across all 11 screens | — | Audit + axe-core in CI |

---

## Screen → Story Mapping

| Screen | Description | Stories |
|---|---|---|
| S1 | Connexion (Login) | NSLRMP-8 |
| S2a | Gestionnaire KPI Dashboard | NSLRMP-13 |
| S2b | Staff Operational Dashboard | NSLRMP-18 |
| S3 | Compte de résultat (P&L) | NSLRMP-14 |
| S4 | Marge brute (Gross margin) | NSLRMP-16 |
| S5 | Registre HACCP | NSLRMP-19 |
| S6 | Checklist ouverture | NSLRMP-20 |
| S7 | Planning équipe | NSLRMP-22 |
| S8 | Matrice permissions RBAC | NSLRMP-12 |
| S9 | Gestion utilisateurs | NSLRMP-11 |
| S10 | Soumission heures (staff) | NSLRMP-21 |

## Feature → Story Mapping

| Feature | Description | Stories |
|---|---|---|
| F1 | Break-even / seuil de rentabilité (CCN HCR) | NSLRMP-15 |
| F2 | Monthly P&L (PCG 82) | NSLRMP-14 |
| F3 | Gross margin % (5 categories) | NSLRMP-16 |
| F4 | Cash flow + TVA CA3 | NSLRMP-17 |
| F5 | Daily CA WhatsApp/email alert | NSLRMP-27 |
| F6 | Weekly MB% WhatsApp/email alert | NSLRMP-28 |
| F7 | FR/EN i18n toggle | NSLRMP-31, NSLRMP-32, NSLRMP-33 |
| F8 | User account management | NSLRMP-11 |
| F9 | Staff weekly hours submission | NSLRMP-21 |

# Maintainr SaaS

Maintainr SaaS is the production-ready, bilingual property-maintenance application. It provides private, organization-scoped workspaces for Property Managers, Tenants, Technicians, and Flat Owners. It is independent from the public marketing and demo product in `Danii44/Maintainr_commercial`.

> **Database boundary:** This application uses its own PostgreSQL database through `DATABASE_URL`. Never connect it to the commercial quotation/demo database and never place database credentials in frontend variables.

## How the product works

A Property Manager creates a secure workspace and becomes its first Manager. The Manager configures the organization name, Arabic name, logo, colors, property list, and units. Tenants and Technicians either receive a Manager-approved invitation or use the public application path. Each user creates a private password and is routed automatically to the portal that matches the stored role.

| Step | Operational flow |
|---:|---|
| 1 | A Manager creates a workspace at `/create-workspace` and is routed to `/manager`. |
| 2 | The Manager adds properties, units, users, assignments, branding, and reminders. |
| 3 | A Tenant reports an issue at `/tenant`, with optional media evidence. |
| 4 | The Manager reviews the request, sets priority, assigns a Technician, and sees the audit record. |
| 5 | The Technician works the assigned request at `/technician`, uploads proof, and submits completion notes. A ticket cannot be resolved without both. |
| 6 | The Tenant follows the request; the Flat Owner at `/owner` sees only unit-scoped performance and activity. |
| 7 | Managers create and edit reminders; workspace-wide reminders are visible and acknowledgeable by all roles, while unit and technician reminders remain isolated. |

## Required services

| Service | Required | Purpose |
|---|---:|---|
| Node.js 20+ and pnpm | Yes | Local development, checks, tests, and builds. |
| PostgreSQL or Supabase PostgreSQL | Yes | Organizations, users, sessions, tickets, reminders, audit data, and settings. |
| Netlify | Optional host | Static frontend and server functions for a Netlify deployment. |
| S3-compatible storage | Optional | Ticket evidence and technician proof files. |
| Resend | Optional | Transactional email notifications. |
| Twilio | Optional | SMS notifications; leave disabled until independently tested. |

## Install the database

Create a new, empty PostgreSQL database owned by your organization. Import the baseline first, then the operational expansion:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema/POSTGRESQL_SCHEMA.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema/MAINTAINR_SAAS_SCHEMA.sql
```

`database/schema/POSTGRESQL_SCHEMA.sql` is the canonical full baseline. `database/schema/MAINTAINR_SAAS_SCHEMA.sql` is a required additive, idempotent expansion for conversations, notifications, calendar data, evidence metadata, and related operational features. Do **not** import `database/qa/DEMO_ACCOUNTS_SEED.sql` or `database/qa/REMOVE_DEMO_DATA_KEEP_LOGINS.sql` into a customer database; they are isolated QA utilities only.

## Configure secrets safely

Copy `.env.example` locally for reference and set real values only in the deployment provider's server-side secret manager. Do not commit a populated `.env` file.

| Variable group | Required use |
|---|---|
| `DATABASE_URL`, `JWT_SECRET`, `AUTH_BASE_URL` | Required for a secure independent deployment. |
| `BOOTSTRAP_MANAGER_EMAIL` | Optional legacy bootstrap compatibility; new workspaces use `/create-workspace`. |
| `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL` | Required only when email notifications are enabled. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Required only when SMS is intentionally enabled. |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` | Required only when durable customer media storage is enabled. |
| `REMINDER_CALLBACK_SECRET` | Required when reminder scheduling is enabled. |

Keep email and SMS disabled in Workspace Settings until provider configuration is complete and a controlled test succeeds. The in-product workspace setup contains organization identity and notification toggles only; it never accepts provider secrets.

## Local commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm build:netlify
pnpm dev
```

The normal build publishes `dist/public`. For Netlify, use `pnpm build:netlify` and the repository's `netlify.toml`. This repository is source-only: no deployment occurs from these commands without a user-controlled host action.

## First-run checklist

After the first Manager signs in, save the English and Arabic organization names, logo URL, primary color, and accent color. Create a property and units, then add or invite one user for each role. Test sign-in, invitation activation, password reset, tenant reporting with media, Manager assignment, Technician completion proof, Owner scoping, reminders, messages, calendar, Arabic RTL, and a mobile viewport before production use.

## Security requirements

Use HTTPS, rotate exposed credentials, enable PostgreSQL backups, restrict S3 to the smallest required permission set, and use a least-privilege database account. Password hashes are never returned from authenticated public API routes. Sessions are server-side and revocable. Workspace data is scoped by organization, and role procedures enforce the permitted action and record visibility.

## Kept project structure

| Path | Why it remains |
|---|---|
| `client/`, `server/`, `shared/` | Application interface, API, authentication, and shared permission rules. |
| `drizzle/` | PostgreSQL schema and migration tooling. |
| `netlify/` | Netlify function entrypoints. |
| `scripts/` | QA-safe, schema, and release verification utilities. |
| `tests/`, `server/*.test.ts` | Regression coverage for security, roles, and workflows. |
| `.env.example`, SQL files, `netlify.toml`, package/config files | Installation, deployment, and build contracts. |

No credentials, generated output, runtime logs, or duplicate documentation files are kept in the repository.

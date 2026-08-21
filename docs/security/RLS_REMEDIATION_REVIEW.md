# SaaS Row Level Security Remediation Review

> **Review-only material.** This document and its companion SQL file are intentionally **not** an instruction to modify the production database automatically. Execute nothing until an authorized owner approves the plan, confirms backups, and schedules a deployment window.

The production SaaS Supabase project (`oejssbztdzngukqkobun`) was inspected in read-only mode on 20 August 2026. The audit identified that **Row Level Security (RLS) was disabled on 22 public operational tables**, including every table that carries multi-tenant ticketing, reminder, appointment, message, evidence, and notification data. The four active roles remain **PROPERTY_MANAGER**, **TENANT**, **TECHNICIAN**, and **FLAT_OWNER**. The existing lifecycle remains **OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED**.

Supabase recommends enabling RLS on exposed tables and pairing it with explicit grants; a table with RLS disabled can be accessible to any database role that retains a grant.[1]

## Scope and safety posture

The companion script, [`20260821_saas_rls_lockdown_review.sql`](../../supabase/review-only/20260821_saas_rls_lockdown_review.sql), provides a conservative first stage. It enables RLS and revokes all `anon` and `authenticated` privileges on the following 22 tables. It **does not** create a broad client-access policy.

| Data domain | Tables protected in Stage 1 |
|---|---|
| Tenant and identity records | `organizations`, `properties`, `units`, `users`, `sessions`, `passwordResetTokens`, `roleApplications`, `accountInvitations` |
| Ticketing and evidence | `tickets`, `ticketMedia`, `ticketLogs`, `evidenceAssets` |
| Planned maintenance | `maintenanceReminders`, `reminderRuns`, `reminderAcknowledgements`, `maintenanceAppointments` |
| Communication and service workflow | `serviceInquiries`, `conversations`, `conversationParticipants`, `conversationMessages`, `userNotifications` |
| Organization configuration | `developerSettings` |

This posture matches the current architecture: application requests pass through the protected SaaS server and tRPC routers rather than through browser-side Supabase table APIs. The application layer already enforces organization, unit, role, ticket-assignment, and conversation-participant checks. Stage 1 makes the database reject any accidental direct browser access instead of duplicating incomplete rules in an RLS policy.

## Required review before approval

The production schema has no recorded Supabase migration history, so this must first be adopted as a numbered migration in the team's chosen migration process. Do not run an ad hoc SQL editor session as the permanent source of truth.

| Review item | Required acceptance criterion |
|---|---|
| Connection path | Confirm every production write and read uses a protected server-only PostgreSQL credential or a tightly controlled server-side service role. No privileged credential may reach the browser. |
| Direct client access | Confirm the dashboard does not call Supabase PostgREST, Realtime, Storage, or RPC directly. If it does, do **not** use the Stage 1 script alone; design and test table-specific policies first. |
| Authentication mapping | If client-side access is introduced later, establish a verified mapping from `auth.uid()` to `public.users` before granting access. Do not use editable user metadata as authorization evidence.[1] |
| Backups and rollback | Record a successful database backup, a named rollback owner, and the table-specific rollback procedure before deployment. |
| Migration discipline | Save the approved script as a committed, numbered migration and run it first against a restored production snapshot or staging project. |

## Future role-aware policy design

If direct Supabase browser access becomes a product requirement, policies must be created separately for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`, and scoped to the `authenticated` role. Supabase notes that policy checks and grants are separate controls, and that an update additionally needs a compatible select policy.[1]

| Actor | Required data boundary for any future policy |
|---|---|
| Property manager | Own organization only; may administer properties, units, users, workflow assignment, settings, appointments, and reports. |
| Tenant | Own unit and own submissions only; may create a ticket or inquiry for the current unit and read conversations where they are a participant. |
| Technician | Assigned tickets, assigned reminders and appointments, plus related evidence and conversations only. |
| Flat owner | Own unit and owner-visible workflow only; never another unit or organization. |

Every policy predicate should use indexed ownership fields such as `organizationId`, `unitId`, `assignedToId`, `submittedById`, `userId`, and conversation membership. The policy test suite must cover both allowed and denied behavior for all four roles and for `anon` access. Supabase specifically recommends testing policies as part of the same change because an overly permissive policy can fail silently.[1]

## Approved deployment sequence

First, restore a production backup into a non-production Supabase project and run the review script there. Then run the existing automated suite and complete manual smoke tests for sign-in, role dashboards, ticket creation, assignment, technician proof upload, status change, resolution, notification reading, reminders, conversations, appointments, and logout. Confirm that direct anonymous and authenticated table calls return `42501` or no rows as intended.

After those checks pass, schedule a short production maintenance window. Take a fresh backup, deploy the reviewed migration, validate that all 22 tables report `rowsecurity = true`, and repeat the smoke tests using one account from each of the four active roles. Keep the rollback owner available until the verification record is signed off.

## Explicit non-actions

No RLS statement in this repository has been applied to `oejssbztdzngukqkobun`. No production records, users, tickets, notifications, sessions, or settings have been changed. The companion SQL is a **review artifact only**.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"

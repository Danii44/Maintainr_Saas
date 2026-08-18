# Maintainr SaaS Supabase Setup

Create a Supabase project dedicated only to **real Maintainr customer workspaces**. Do not use this project for quotation requests or public demo data.

1. In the SaaS Supabase project, open **SQL Editor** and run `SUPABASE_SAAS_SCHEMA.sql` once. The script is idempotent and includes the current profile-avatar and workspace-onboarding columns.
2. In Supabase **Connect**, copy the server-side PostgreSQL pooler connection string. Keep the password private.
3. In the `Maintainr_Saas` Netlify site, set `DATABASE_URL` to that connection string. Add the remaining values from `.env.example`; `JWT_SECRET`, `AUTH_BASE_URL`, and `REMINDER_CALLBACK_SECRET` are required for a production rollout.
4. Deploy, then check `/api/health/database`. Only after that, create a real workspace through `/create-workspace`.

> The `DATABASE_URL` used here must never be copied into `Maintainr_commercial`.

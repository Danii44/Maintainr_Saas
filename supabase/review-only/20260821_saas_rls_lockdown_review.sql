-- REVIEW ONLY — DO NOT APPLY TO PRODUCTION WITHOUT AN APPROVED DEPLOYMENT WINDOW.
-- Target: Maintainr SaaS Supabase project only (oejssbztdzngukqkobun).
-- Never run this script against the separate Commercial/demo project.
--
-- Intent: block direct anon/authenticated access to all operational tables while
-- allowing the existing server-side data path to be validated deliberately. No
-- permissive client policy is created by this script.
--
-- Before execution, confirm:
--   1. The application server uses a protected server-side database credential.
--   2. No browser client calls Supabase PostgREST, Realtime, or Storage directly.
--   3. A production backup, rollback owner, and smoke-test window are available.

-- Preflight: this must return exactly the listed operational tables.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY (ARRAY[
    'organizations',
    'properties',
    'units',
    'users',
    'sessions',
    'passwordResetTokens',
    'tickets',
    'ticketMedia',
    'ticketLogs',
    'maintenanceReminders',
    'reminderRuns',
    'reminderAcknowledgements',
    'developerSettings',
    'serviceInquiries',
    'conversations',
    'conversationParticipants',
    'conversationMessages',
    'maintenanceAppointments',
    'evidenceAssets',
    'userNotifications',
    'roleApplications',
    'accountInvitations'
  ]::text[])
ORDER BY tablename;

BEGIN;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'organizations',
    'properties',
    'units',
    'users',
    'sessions',
    'passwordResetTokens',
    'tickets',
    'ticketMedia',
    'ticketLogs',
    'maintenanceReminders',
    'reminderRuns',
    'reminderAcknowledgements',
    'developerSettings',
    'serviceInquiries',
    'conversations',
    'conversationParticipants',
    'conversationMessages',
    'maintenanceAppointments',
    'evidenceAssets',
    'userNotifications',
    'roleApplications',
    'accountInvitations'
  ]::text[]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', target_table);
  END LOOP;
END $$;

COMMIT;

-- Postflight: all rows must show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = ANY (ARRAY[
    'organizations',
    'properties',
    'units',
    'users',
    'sessions',
    'passwordResetTokens',
    'tickets',
    'ticketMedia',
    'ticketLogs',
    'maintenanceReminders',
    'reminderRuns',
    'reminderAcknowledgements',
    'developerSettings',
    'serviceInquiries',
    'conversations',
    'conversationParticipants',
    'conversationMessages',
    'maintenanceAppointments',
    'evidenceAssets',
    'userNotifications',
    'roleApplications',
    'accountInvitations'
  ]::text[])
ORDER BY tablename;

-- Rollback is intentionally not automated. If an approved deployment proves
-- incompatible, restore from the pre-change backup or issue a separately
-- reviewed script that disables RLS only on the affected table.
--
-- Do not add broad `USING (true)` or `WITH CHECK (true)` policies. If future
-- client-side Supabase access is intentionally introduced, create narrowly
-- scoped policies based on a verified JWT-to-public.users mapping, organization
-- membership, role, unit ownership, ticket assignment, and conversation
-- participation.

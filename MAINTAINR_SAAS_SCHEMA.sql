-- Maintainr live SaaS operational expansion.
-- Apply only to the standalone Maintainr SaaS PostgreSQL/Supabase database.
-- Never apply this file to the separate commercial/demo database.
-- This is additive and idempotent: it preserves existing users, properties,
-- units, tickets, reminders, and existing customer records.

BEGIN;

DO $$ BEGIN
  CREATE TYPE "conversationKind" AS ENUM ('GENERAL', 'TICKET', 'INQUIRY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "inquiryKind" AS ENUM ('INQUIRY', 'COMPLAINT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "inquiryStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "appointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "evidencePurpose" AS ENUM ('ISSUE_EVIDENCE', 'COMPLETION_PROOF', 'INQUIRY_ATTACHMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "serviceInquiries" (
  "id" serial PRIMARY KEY,
  "organizationId" integer NOT NULL,
  "unitId" integer,
  "createdById" integer NOT NULL,
  "assignedToId" integer,
  "kind" "inquiryKind" NOT NULL DEFAULT 'INQUIRY',
  "status" "inquiryStatus" NOT NULL DEFAULT 'OPEN',
  "subject" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "resolution" text,
  "resolvedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" serial PRIMARY KEY,
  "organizationId" integer NOT NULL,
  "ticketId" integer,
  "inquiryId" integer,
  "subject" varchar(255) NOT NULL,
  "kind" "conversationKind" NOT NULL DEFAULT 'GENERAL',
  "createdById" integer NOT NULL,
  "isClosed" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversationParticipants" (
  "conversationId" integer NOT NULL,
  "userId" integer NOT NULL,
  "lastReadAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("conversationId", "userId")
);

CREATE TABLE IF NOT EXISTS "conversationMessages" (
  "id" serial PRIMARY KEY,
  "conversationId" integer NOT NULL,
  "authorId" integer NOT NULL,
  "body" text NOT NULL CHECK (char_length(trim("body")) BETWEEN 1 AND 4000),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "maintenanceAppointments" (
  "id" serial PRIMARY KEY,
  "organizationId" integer NOT NULL,
  "propertyId" integer,
  "unitId" integer,
  "ticketId" integer,
  "technicianId" integer,
  "createdById" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "notes" text,
  "status" "appointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledStart" timestamptz NOT NULL,
  "scheduledEnd" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "maintenance_appointments_valid_range" CHECK ("scheduledEnd" > "scheduledStart")
);

CREATE TABLE IF NOT EXISTS "evidenceAssets" (
  "id" serial PRIMARY KEY,
  "organizationId" integer NOT NULL,
  "ticketId" integer,
  "inquiryId" integer,
  "appointmentId" integer,
  "uploadedById" integer NOT NULL,
  "storageKey" text NOT NULL,
  "url" text NOT NULL,
  "fileName" varchar(255) NOT NULL,
  "contentType" varchar(128) NOT NULL,
  "purpose" "evidencePurpose" NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "evidence_assets_has_parent" CHECK (
    (CASE WHEN "ticketId" IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN "inquiryId" IS NULL THEN 0 ELSE 1 END) +
    (CASE WHEN "appointmentId" IS NULL THEN 0 ELSE 1 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS "service_inquiries_org_status_idx"
  ON "serviceInquiries" ("organizationId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "service_inquiries_unit_idx"
  ON "serviceInquiries" ("unitId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "service_inquiries_assignee_idx"
  ON "serviceInquiries" ("assignedToId", "status");
CREATE INDEX IF NOT EXISTS "conversations_org_updated_idx"
  ON "conversations" ("organizationId", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "conversations_ticket_idx"
  ON "conversations" ("ticketId");
CREATE INDEX IF NOT EXISTS "conversations_inquiry_idx"
  ON "conversations" ("inquiryId");
CREATE INDEX IF NOT EXISTS "conversation_participants_user_idx"
  ON "conversationParticipants" ("userId", "conversationId");
CREATE INDEX IF NOT EXISTS "conversation_messages_conversation_created_idx"
  ON "conversationMessages" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "maintenance_appointments_org_start_idx"
  ON "maintenanceAppointments" ("organizationId", "scheduledStart");
CREATE INDEX IF NOT EXISTS "maintenance_appointments_technician_start_idx"
  ON "maintenanceAppointments" ("technicianId", "scheduledStart");
CREATE INDEX IF NOT EXISTS "maintenance_appointments_unit_start_idx"
  ON "maintenanceAppointments" ("unitId", "scheduledStart");
CREATE INDEX IF NOT EXISTS "maintenance_appointments_ticket_idx"
  ON "maintenanceAppointments" ("ticketId");
CREATE INDEX IF NOT EXISTS "evidence_assets_ticket_idx"
  ON "evidenceAssets" ("ticketId", "createdAt");
CREATE INDEX IF NOT EXISTS "evidence_assets_inquiry_idx"
  ON "evidenceAssets" ("inquiryId", "createdAt");
CREATE INDEX IF NOT EXISTS "evidence_assets_appointment_idx"
  ON "evidenceAssets" ("appointmentId", "createdAt");
CREATE INDEX IF NOT EXISTS "evidence_assets_org_idx"
  ON "evidenceAssets" ("organizationId", "createdAt");

CREATE TABLE IF NOT EXISTS "userNotifications" (
  "id" serial PRIMARY KEY,
  "organizationId" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" varchar(48) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text,
  "href" varchar(512),
  "readAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "user_notifications_user_unread_idx"
  ON "userNotifications" ("userId", "readAt", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "user_notifications_org_created_idx"
  ON "userNotifications" ("organizationId", "createdAt" DESC);

COMMIT;

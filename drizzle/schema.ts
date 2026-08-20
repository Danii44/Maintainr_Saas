import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["PROPERTY_MANAGER", "TENANT", "TECHNICIAN", "FLAT_OWNER"]);
export const subscriptionTierEnum = pgEnum("subscriptionTier", ["STARTER", "GROWTH", "ENTERPRISE"]);
export const categoryEnum = pgEnum("category", ["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "OTHER"]);
export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH", "EMERGENCY"]);
export const statusEnum = pgEnum("status", ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
export const mediaTypeEnum = pgEnum("mediaType", ["IMAGE", "VIDEO"]);
export const reminderCadenceEnum = pgEnum("reminderCadence", ["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
export const reminderRunStatusEnum = pgEnum("reminderRunStatus", ["PENDING", "SENT"]);
export const conversationKindEnum = pgEnum("conversationKind", ["GENERAL", "TICKET", "INQUIRY"]);
export const inquiryKindEnum = pgEnum("inquiryKind", ["INQUIRY", "COMPLAINT"]);
export const inquiryStatusEnum = pgEnum("inquiryStatus", ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]);
export const appointmentStatusEnum = pgEnum("appointmentStatus", ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"]);
export const evidencePurposeEnum = pgEnum("evidencePurpose", ["ISSUE_EVIDENCE", "COMPLETION_PROOF", "INQUIRY_ATTACHMENT"]);

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  portfolioCategory: varchar("portfolioCategory", { length: 64 }),
  portfolioSizeRange: varchar("portfolioSizeRange", { length: 24 }),
  onboardingCompletedAt: timestamp("onboardingCompletedAt", { withTimezone: true }),
  subscriptionTier: subscriptionTierEnum("subscriptionTier").notNull().default("STARTER"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  totalUnits: integer("totalUnits").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ organizationIdx: index("properties_org_idx").on(table.organizationId) }));

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  propertyId: integer("propertyId").notNull(),
  unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
  floorNumber: integer("floorNumber").notNull().default(1),
  accessCode: varchar("accessCode", { length: 6 }).notNull().unique(),
  ownerId: integer("ownerId"),
  currentTenantId: integer("currentTenantId"),
}, (table) => ({ propertyUnitIdx: uniqueIndex("units_property_number_idx").on(table.propertyId, table.unitNumber) }));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  clerkUserId: varchar("clerkUserId", { length: 128 }).unique(),
  organizationId: integer("organizationId"),
  unitId: integer("unitId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  role: roleEnum("role").notNull().default("TENANT"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ orgRoleIdx: index("users_org_role_idx").on(table.organizationId, table.role), unitIdx: index("users_unit_idx").on(table.unitId) }));

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revokedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ userIdx: index("sessions_user_idx").on(table.userId), expiryIdx: index("sessions_expiry_idx").on(table.expiresAt) }));

export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ userIdx: index("password_reset_user_idx").on(table.userId), expiryIdx: index("password_reset_expiry_idx").on(table.expiresAt) }));

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  unitId: integer("unitId").notNull(),
  submittedById: integer("submittedById").notNull(),
  assignedToId: integer("assignedToId"),
  category: categoryEnum("category").notNull(),
  priority: priorityEnum("priority").notNull().default("MEDIUM"),
  status: statusEnum("status").notNull().default("OPEN"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  preferredAccessTime: varchar("preferredAccessTime", { length: 255 }),
  resolutionNotes: text("resolutionNotes"),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ orgStatusIdx: index("tickets_org_status_idx").on(table.organizationId, table.status), assigneeIdx: index("tickets_assignee_idx").on(table.assignedToId), priorityIdx: index("tickets_priority_idx").on(table.priority) }));

export const ticketMedia = pgTable("ticketMedia", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  uploadedById: integer("uploadedById").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mediaTypeEnum("mediaType").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ ticketIdx: index("ticket_media_ticket_idx").on(table.ticketId) }));

export const serviceInquiries = pgTable("serviceInquiries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  unitId: integer("unitId"),
  createdById: integer("createdById").notNull(),
  assignedToId: integer("assignedToId"),
  kind: inquiryKindEnum("kind").notNull().default("INQUIRY"),
  status: inquiryStatusEnum("status").notNull().default("OPEN"),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  organizationStatusIdx: index("service_inquiries_org_status_idx").on(table.organizationId, table.status, table.createdAt),
  unitIdx: index("service_inquiries_unit_idx").on(table.unitId, table.createdAt),
  assigneeIdx: index("service_inquiries_assignee_idx").on(table.assignedToId, table.status),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  ticketId: integer("ticketId"),
  inquiryId: integer("inquiryId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  kind: conversationKindEnum("kind").notNull().default("GENERAL"),
  createdById: integer("createdById").notNull(),
  isClosed: boolean("isClosed").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  organizationUpdatedIdx: index("conversations_org_updated_idx").on(table.organizationId, table.updatedAt),
  ticketIdx: index("conversations_ticket_idx").on(table.ticketId),
  inquiryIdx: index("conversations_inquiry_idx").on(table.inquiryId),
}));

export const conversationParticipants = pgTable("conversationParticipants", {
  conversationId: integer("conversationId").notNull(),
  userId: integer("userId").notNull(),
  lastReadAt: timestamp("lastReadAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationUserIdx: uniqueIndex("conversation_participants_conversation_user_idx").on(table.conversationId, table.userId),
  userIdx: index("conversation_participants_user_idx").on(table.userId, table.conversationId),
}));

export const conversationMessages = pgTable("conversationMessages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  authorId: integer("authorId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conversationCreatedIdx: index("conversation_messages_conversation_created_idx").on(table.conversationId, table.createdAt),
}));

export const maintenanceAppointments = pgTable("maintenanceAppointments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  propertyId: integer("propertyId"),
  unitId: integer("unitId"),
  ticketId: integer("ticketId"),
  technicianId: integer("technicianId"),
  createdById: integer("createdById").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  notes: text("notes"),
  status: appointmentStatusEnum("status").notNull().default("SCHEDULED"),
  scheduledStart: timestamp("scheduledStart", { withTimezone: true }).notNull(),
  scheduledEnd: timestamp("scheduledEnd", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  organizationStartIdx: index("maintenance_appointments_org_start_idx").on(table.organizationId, table.scheduledStart),
  technicianStartIdx: index("maintenance_appointments_technician_start_idx").on(table.technicianId, table.scheduledStart),
  unitStartIdx: index("maintenance_appointments_unit_start_idx").on(table.unitId, table.scheduledStart),
  ticketIdx: index("maintenance_appointments_ticket_idx").on(table.ticketId),
}));

export const evidenceAssets = pgTable("evidenceAssets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  ticketId: integer("ticketId"),
  inquiryId: integer("inquiryId"),
  appointmentId: integer("appointmentId"),
  uploadedById: integer("uploadedById").notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  purpose: evidencePurposeEnum("purpose").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ticketIdx: index("evidence_assets_ticket_idx").on(table.ticketId, table.createdAt),
  inquiryIdx: index("evidence_assets_inquiry_idx").on(table.inquiryId, table.createdAt),
  appointmentIdx: index("evidence_assets_appointment_idx").on(table.appointmentId, table.createdAt),
  organizationIdx: index("evidence_assets_org_idx").on(table.organizationId, table.createdAt),
}));

export const maintenanceReminders = pgTable("maintenanceReminders", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  propertyId: integer("propertyId"),
  unitId: integer("unitId"),
  assignedToId: integer("assignedToId"),
  createdById: integer("createdById").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  cadence: reminderCadenceEnum("cadence").notNull().default("ONCE"),
  dueAt: timestamp("dueAt", { withTimezone: true }).notNull(),
  nextRunAt: timestamp("nextRunAt", { withTimezone: true }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ organizationIdx: index("reminders_org_idx").on(table.organizationId), nextRunIdx: index("reminders_next_run_idx").on(table.nextRunAt, table.isActive), scheduleUidIdx: uniqueIndex("reminders_schedule_uid_idx").on(table.scheduleCronTaskUid) }));

export const reminderRuns = pgTable("reminderRuns", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminderId").notNull(),
  occurrenceAt: timestamp("occurrenceAt", { withTimezone: true }).notNull(),
  status: reminderRunStatusEnum("status").notNull().default("PENDING"),
  sentAt: timestamp("sentAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ reminderOccurrenceIdx: uniqueIndex("reminder_runs_occurrence_idx").on(table.reminderId, table.occurrenceAt) }));

export const reminderAcknowledgements = pgTable("reminderAcknowledgements", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminderId").notNull(),
  userId: integer("userId").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ reminderUserIdx: uniqueIndex("reminder_ack_reminder_user_idx").on(table.reminderId, table.userId), userIdx: index("reminder_ack_user_idx").on(table.userId) }));

export const developerSettings = pgTable("developerSettings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().unique(),
  projectName: varchar("projectName", { length: 120 }).notNull().default("Maintainr"),
  projectNameArabic: varchar("projectNameArabic", { length: 120 }).notNull().default("Maintainr"),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 16 }).notNull().default("#0F766E"),
  accentColor: varchar("accentColor", { length: 16 }).notNull().default("#0EA5E9"),
  emailNotificationsEnabled: boolean("emailNotificationsEnabled").notNull().default(false),
  smsNotificationsEnabled: boolean("smsNotificationsEnabled").notNull().default(false),
  updatedById: integer("updatedById").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const userNotifications = pgTable("userNotifications", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  userId: integer("userId").notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  href: varchar("href", { length: 512 }),
  readAt: timestamp("readAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userUnreadIdx: index("user_notifications_user_unread_idx").on(table.userId, table.readAt, table.createdAt),
  organizationCreatedIdx: index("user_notifications_org_created_idx").on(table.organizationId, table.createdAt),
}));

export const ticketLogs = pgTable("ticketLogs", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticketId").notNull(),
  actorId: integer("actorId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  message: text("message"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ ticketLogIdx: index("ticket_logs_ticket_idx").on(table.ticketId, table.createdAt) }));

export const roleApplications = pgTable("roleApplications", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId"),
  managerEmail: varchar("managerEmail", { length: 320 }).notNull(),
  requestedRole: roleEnum("requestedRole").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  message: text("message"),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  requestedUnitId: integer("requestedUnitId"),
  reviewedById: integer("reviewedById"),
  reviewedAt: timestamp("reviewedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ statusIdx: index("role_applications_status_idx").on(table.status, table.createdAt), emailIdx: index("role_applications_email_idx").on(table.email) }));

export const accountInvitations = pgTable("accountInvitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull(),
  requestedRole: roleEnum("requestedRole").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  unitId: integer("unitId"),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ emailIdx: index("account_invites_email_idx").on(table.email), expiryIdx: index("account_invites_expiry_idx").on(table.expiresAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

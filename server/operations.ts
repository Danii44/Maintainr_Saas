import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  appointmentStatusEnum,
  conversationMessages,
  conversationParticipants,
  conversations,
  evidenceAssets,
  maintenanceAppointments,
  serviceInquiries,
  ticketLogs,
  tickets,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const roles = ["PROPERTY_MANAGER", "TENANT", "TECHNICIAN", "FLAT_OWNER"] as const;
const managersOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "PROPERTY_MANAGER") throw new Error("Manager role required / يلزم دور مدير العقار");
  return next();
});

function requireOrganization(user: { organizationId: number | null }) {
  if (!user.organizationId) throw new Error("Workspace context is unavailable / مساحة العمل غير متاحة");
  return user.organizationId;
}

async function conversationVisibleTo(
  conversationId: number,
  user: { id: number; role: string; organizationId: number | null },
) {
  const db = await getDb();
  const organizationId = requireOrganization(user);
  if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
  const conversation = (await db.select().from(conversations).where(and(eq(conversations.id, conversationId), eq(conversations.organizationId, organizationId))).limit(1))[0];
  if (!conversation) throw new Error("Conversation not found / المحادثة غير موجودة");
  if (user.role === "PROPERTY_MANAGER") return { db, conversation, organizationId };
  const member = (await db.select().from(conversationParticipants).where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, user.id))).limit(1))[0];
  if (!member) throw new Error("Conversation access is not available / لا تملك صلاحية المحادثة");
  return { db, conversation, organizationId };
}

function isUnitViewer(role: string) {
  return role === "TENANT" || role === "FLAT_OWNER";
}

export const operationsRouter = router({
  manager: router({
    oversight: managersOnly.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const evidence = await db.select().from(evidenceAssets).where(eq(evidenceAssets.organizationId, organizationId)).orderBy(desc(evidenceAssets.createdAt)).limit(24);
      const organizationTickets = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.organizationId, organizationId));
      const ids = organizationTickets.map((ticket) => ticket.id);
      const history = ids.length ? await db.select().from(ticketLogs).where(inArray(ticketLogs.ticketId, ids)).orderBy(desc(ticketLogs.createdAt)).limit(40) : [];
      const contacts = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, unitId: users.unitId }).from(users).where(eq(users.organizationId, organizationId)).orderBy(users.role, users.name);
      return { evidence, history, contacts };
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");

      const ticketFilters = [eq(tickets.organizationId, organizationId)];
      if (isUnitViewer(ctx.user.role)) ticketFilters.push(eq(tickets.unitId, ctx.user.unitId ?? -1));
      if (ctx.user.role === "TECHNICIAN") ticketFilters.push(eq(tickets.assignedToId, ctx.user.id));
      const visibleTickets = await db.select().from(tickets).where(and(...ticketFilters)).orderBy(desc(tickets.updatedAt));

      const appointmentFilters = [eq(maintenanceAppointments.organizationId, organizationId)];
      if (isUnitViewer(ctx.user.role)) appointmentFilters.push(eq(maintenanceAppointments.unitId, ctx.user.unitId ?? -1));
      if (ctx.user.role === "TECHNICIAN") appointmentFilters.push(eq(maintenanceAppointments.technicianId, ctx.user.id));
      const appointments = await db.select().from(maintenanceAppointments).where(and(...appointmentFilters)).orderBy(maintenanceAppointments.scheduledStart).limit(6);

      const inquiryFilters = [eq(serviceInquiries.organizationId, organizationId)];
      if (isUnitViewer(ctx.user.role)) inquiryFilters.push(or(eq(serviceInquiries.unitId, ctx.user.unitId ?? -1), eq(serviceInquiries.createdById, ctx.user.id))!);
      if (ctx.user.role === "TECHNICIAN") inquiryFilters.push(eq(serviceInquiries.assignedToId, ctx.user.id));
      const inquiries = await db.select().from(serviceInquiries).where(and(...inquiryFilters)).orderBy(desc(serviceInquiries.updatedAt)).limit(6);

      const activeTickets = visibleTickets.filter((ticket) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(ticket.status));
      const resolvedTickets = visibleTickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED");
      return {
        metrics: {
          openTickets: activeTickets.length,
          resolvedTickets: resolvedTickets.length,
          urgentTickets: visibleTickets.filter((ticket) => ticket.priority === "HIGH" || ticket.priority === "EMERGENCY").length,
          openInquiries: inquiries.filter((item) => item.status === "OPEN" || item.status === "IN_REVIEW").length,
          scheduledVisits: appointments.filter((item) => item.status === "SCHEDULED" || item.status === "CONFIRMED").length,
        },
        tickets: visibleTickets.slice(0, 6),
        appointments,
        inquiries,
      };
    }),
  }),
  messages: router({
    contacts: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const filters = [eq(users.organizationId, organizationId)];
      if (ctx.user.role !== "PROPERTY_MANAGER") filters.push(eq(users.role, "PROPERTY_MANAGER"));
      return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl }).from(users).where(and(...filters)).orderBy(users.role, users.name);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      if (ctx.user.role === "PROPERTY_MANAGER") return db.select().from(conversations).where(eq(conversations.organizationId, organizationId)).orderBy(desc(conversations.updatedAt)).limit(50);
      return db.select({ id: conversations.id, organizationId: conversations.organizationId, ticketId: conversations.ticketId, inquiryId: conversations.inquiryId, subject: conversations.subject, kind: conversations.kind, createdById: conversations.createdById, createdAt: conversations.createdAt, updatedAt: conversations.updatedAt }).from(conversations).innerJoin(conversationParticipants, eq(conversationParticipants.conversationId, conversations.id)).where(and(eq(conversations.organizationId, organizationId), eq(conversationParticipants.userId, ctx.user.id))).orderBy(desc(conversations.updatedAt)).limit(50);
    }),
    thread: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const { db } = await conversationVisibleTo(input.conversationId, ctx.user);
      const [messages, participants] = await Promise.all([
        db.select().from(conversationMessages).where(eq(conversationMessages.conversationId, input.conversationId)).orderBy(conversationMessages.createdAt),
        db.select({ id: users.id, name: users.name, email: users.email, role: users.role, avatarUrl: users.avatarUrl }).from(conversationParticipants).innerJoin(users, eq(conversationParticipants.userId, users.id)).where(eq(conversationParticipants.conversationId, input.conversationId)),
      ]);
      return { messages, participants };
    }),
    create: protectedProcedure.input(z.object({ subject: z.string().min(3).max(255), participantIds: z.array(z.number().int().positive()).max(12).optional(), ticketId: z.number().int().positive().optional(), inquiryId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const selectedIds = new Set([ctx.user.id, ...(input.participantIds ?? [])]);
      if (ctx.user.role !== "PROPERTY_MANAGER") {
        const managers = await db.select({ id: users.id }).from(users).where(and(eq(users.organizationId, organizationId), eq(users.role, "PROPERTY_MANAGER")));
        managers.forEach((manager) => selectedIds.add(manager.id));
      }
      const validUsers = await db.select({ id: users.id }).from(users).where(and(eq(users.organizationId, organizationId), inArray(users.id, Array.from(selectedIds))));
      if (validUsers.length !== selectedIds.size) throw new Error("A selected conversation participant is outside this workspace / أحد المشاركين خارج مساحة العمل");
      const created = await db.insert(conversations).values({ organizationId, ticketId: input.ticketId, inquiryId: input.inquiryId, subject: input.subject.trim(), kind: input.inquiryId ? "INQUIRY" : input.ticketId ? "TICKET" : "GENERAL", createdById: ctx.user.id }).returning({ id: conversations.id });
      const conversationId = created[0]?.id;
      if (!conversationId) throw new Error("Unable to create conversation / تعذر إنشاء المحادثة");
      await db.insert(conversationParticipants).values(validUsers.map((user) => ({ conversationId, userId: user.id })));
      return { success: true, conversationId };
    }),
    send: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), body: z.string().trim().min(1).max(4000) })).mutation(async ({ ctx, input }) => {
      const { db } = await conversationVisibleTo(input.conversationId, ctx.user);
      await db.insert(conversationMessages).values({ conversationId: input.conversationId, authorId: ctx.user.id, body: input.body });
      await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, input.conversationId));
      await db.update(conversationParticipants).set({ lastReadAt: new Date() }).where(and(eq(conversationParticipants.conversationId, input.conversationId), eq(conversationParticipants.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  inquiries: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const filters = [eq(serviceInquiries.organizationId, organizationId)];
      if (isUnitViewer(ctx.user.role)) filters.push(or(eq(serviceInquiries.unitId, ctx.user.unitId ?? -1), eq(serviceInquiries.createdById, ctx.user.id))!);
      if (ctx.user.role === "TECHNICIAN") filters.push(eq(serviceInquiries.assignedToId, ctx.user.id));
      return db.select().from(serviceInquiries).where(and(...filters)).orderBy(desc(serviceInquiries.updatedAt));
    }),
    create: protectedProcedure.input(z.object({ kind: z.enum(["INQUIRY", "COMPLAINT"]), subject: z.string().trim().min(3).max(255), body: z.string().trim().min(10).max(4000), unitId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "TECHNICIAN") throw new Error("Technicians can respond through assigned conversations / يمكن للفنيين الرد عبر المحادثات المسندة");
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const unitId = isUnitViewer(ctx.user.role) ? ctx.user.unitId : input.unitId;
      const created = await db.insert(serviceInquiries).values({ organizationId, unitId: unitId ?? null, createdById: ctx.user.id, kind: input.kind, subject: input.subject, body: input.body }).returning({ id: serviceInquiries.id });
      return { success: true, inquiryId: created[0]?.id ?? null };
    }),
    update: managersOnly.input(z.object({ inquiryId: z.number().int().positive(), status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]), assignedToId: z.number().int().positive().nullable().optional(), resolution: z.string().max(4000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const current = (await db.select().from(serviceInquiries).where(and(eq(serviceInquiries.id, input.inquiryId), eq(serviceInquiries.organizationId, organizationId))).limit(1))[0];
      if (!current) throw new Error("Inquiry not found / الاستفسار غير موجود");
      if (input.assignedToId) {
        const assignee = (await db.select({ id: users.id }).from(users).where(and(eq(users.id, input.assignedToId), eq(users.organizationId, organizationId))).limit(1))[0];
        if (!assignee) throw new Error("Assignee is outside this workspace / المسؤول خارج مساحة العمل");
      }
      await db.update(serviceInquiries).set({ status: input.status, assignedToId: input.assignedToId, resolution: input.resolution, resolvedAt: input.status === "RESOLVED" || input.status === "CLOSED" ? new Date() : null, updatedAt: new Date() }).where(eq(serviceInquiries.id, input.inquiryId));
      return { success: true };
    }),
  }),
  calendar: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const filters = [eq(maintenanceAppointments.organizationId, organizationId)];
      if (isUnitViewer(ctx.user.role)) filters.push(eq(maintenanceAppointments.unitId, ctx.user.unitId ?? -1));
      if (ctx.user.role === "TECHNICIAN") filters.push(eq(maintenanceAppointments.technicianId, ctx.user.id));
      return db.select().from(maintenanceAppointments).where(and(...filters)).orderBy(maintenanceAppointments.scheduledStart);
    }),
    create: managersOnly.input(z.object({ title: z.string().trim().min(3).max(255), scheduledStart: z.string().datetime(), scheduledEnd: z.string().datetime(), propertyId: z.number().int().positive().optional(), unitId: z.number().int().positive().optional(), ticketId: z.number().int().positive().optional(), technicianId: z.number().int().positive().optional(), notes: z.string().max(4000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const scheduledStart = new Date(input.scheduledStart);
      const scheduledEnd = new Date(input.scheduledEnd);
      if (scheduledEnd <= scheduledStart) throw new Error("The visit end time must be after the start time / يجب أن يكون وقت الانتهاء بعد وقت البداية");
      if (input.technicianId) {
        const technician = (await db.select({ id: users.id }).from(users).where(and(eq(users.id, input.technicianId), eq(users.organizationId, organizationId), eq(users.role, "TECHNICIAN"))).limit(1))[0];
        if (!technician) throw new Error("Technician not found in this workspace / الفني غير موجود في مساحة العمل");
      }
      const created = await db.insert(maintenanceAppointments).values({ ...input, organizationId, createdById: ctx.user.id, scheduledStart, scheduledEnd }).returning({ id: maintenanceAppointments.id });
      return { success: true, appointmentId: created[0]?.id ?? null };
    }),
    updateStatus: managersOnly.input(z.object({ appointmentId: z.number().int().positive(), status: z.enum(appointmentStatusEnum.enumValues) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const organizationId = requireOrganization(ctx.user);
      if (!db) throw new Error("Database unavailable / قاعدة البيانات غير متاحة");
      const result = await db.update(maintenanceAppointments).set({ status: input.status, updatedAt: new Date() }).where(and(eq(maintenanceAppointments.id, input.appointmentId), eq(maintenanceAppointments.organizationId, organizationId))).returning({ id: maintenanceAppointments.id });
      if (!result[0]) throw new Error("Appointment not found / الموعد غير موجود");
      return { success: true };
    }),
  }),
});

export type OperationsRole = typeof roles[number];

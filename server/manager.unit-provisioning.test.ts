import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./db", () => ({ getDb: getDbMock }));
vi.mock("./notifications", () => ({ sendTicketEmail: vi.fn() }));

function context(role: "PROPERTY_MANAGER" | "TENANT"): TrpcContext {
  return {
    user: { id: role === "PROPERTY_MANAGER" ? 10 : 20, openId: `qa_${role}`, organizationId: 7, unitId: null, name: "QA User", email: "qa.user@maintainr.test", passwordHash: "hash", phone: null, role, loginMethod: "password", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function selection(rows: unknown[]) {
  return { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => rows) })) })) };
}

function createDb({ property = { id: 15 }, existingUnit = false }: { property?: { id: number } | null; existingUnit?: boolean } = {}) {
  const inserts: unknown[] = [];
  return {
    inserts,
    select: vi.fn().mockReturnValueOnce(selection(property ? [property] : [])).mockReturnValueOnce(selection(existingUnit ? [{ id: 23 }] : [])),
    insert: vi.fn((table: unknown) => ({ values: vi.fn((value: unknown) => { inserts.push({ table, value }); return { returning: vi.fn(async () => [{ id: 22 }]) }; }) })),
  };
}

describe("manager.createUnit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists properties only inside the authenticated Manager organization", async () => {
    const visibleProperties = [{ id: 15, name: "QA Property", address: "QA Only", totalUnits: 0 }];
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(async () => visibleProperties) })) })) };
    getDbMock.mockResolvedValue(db);

    await expect(appRouter.createCaller(context("PROPERTY_MANAGER")).manager.listProperties()).resolves.toEqual(visibleProperties);
    await expect(appRouter.createCaller(context("TENANT")).manager.listProperties()).rejects.toThrow("Manager role required");
  });

  it("lists units only inside the authenticated Manager organization", async () => {
    const visibleUnits = [{ id: 22, unitNumber: "QA-101", floorNumber: 1, propertyName: "QA Property" }];
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(async () => visibleUnits) })) })) })) };
    getDbMock.mockResolvedValue(db);

    await expect(appRouter.createCaller(context("PROPERTY_MANAGER")).manager.listUnits()).resolves.toEqual(visibleUnits);
    await expect(appRouter.createCaller(context("TENANT")).manager.listUnits()).rejects.toThrow("Manager role required");
  });

  it("creates a unit only inside the Manager organization and returns its access code", async () => {
    const db = createDb();
    getDbMock.mockResolvedValue(db);

    const result = await appRouter.createCaller(context("PROPERTY_MANAGER")).manager.createUnit({ propertyId: 15, unitNumber: "QA-101", floorNumber: 1 });

    expect(result).toMatchObject({ success: true, unitId: 22 });
    expect(result.accessCode).toMatch(/^\d{6}$/);
    expect((db.inserts[0] as { value: { propertyId?: number; unitNumber?: string } }).value).toMatchObject({ propertyId: 15, unitNumber: "QA-101" });
  });

  it("rejects a property outside the Manager organization without creating a unit", async () => {
    const db = createDb({ property: null });
    getDbMock.mockResolvedValue(db);

    await expect(appRouter.createCaller(context("PROPERTY_MANAGER")).manager.createUnit({ propertyId: 99, unitNumber: "QA-101" })).rejects.toThrow("Property not found in your organization");
    expect(db.inserts).toHaveLength(0);
  });

  it("does not allow a non-Manager to create a unit", async () => {
    await expect(appRouter.createCaller(context("TENANT")).manager.createUnit({ propertyId: 15, unitNumber: "QA-101" })).rejects.toThrow("Manager role required");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { getDbMock, sendTicketEmailMock } = vi.hoisted(() => ({ getDbMock: vi.fn(), sendTicketEmailMock: vi.fn() }));

vi.mock("./db", () => ({ getDb: getDbMock }));
vi.mock("./notifications", () => ({ sendTicketEmail: sendTicketEmailMock }));

function context(role: "PROPERTY_MANAGER" | "TENANT"): TrpcContext {
  return {
    user: { id: role === "PROPERTY_MANAGER" ? 10 : 20, openId: `qa_${role}`, organizationId: 7, unitId: role === "TENANT" ? 22 : null, name: "QA User", email: "qa.user@maintainr.test", passwordHash: "hash", phone: null, role, loginMethod: "password", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createDb({ unit = { id: 22 }, existingUser = false }: { unit?: { id: number } | null; existingUser?: boolean } = {}) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  const unitSelection = { from: vi.fn(() => ({ innerJoin: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => unit ? [unit] : []) })) })) })) };
  const userSelection = { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => existingUser ? [{ id: 91 }] : []) })) })) };
  return {
    inserts,
    updates,
    select: vi.fn().mockReturnValueOnce(unitSelection).mockReturnValueOnce(userSelection),
    insert: vi.fn((table: unknown) => ({ values: vi.fn((value: unknown) => { inserts.push({ table, value }); return { returning: vi.fn(async () => [{ id: 44 }]) }; }) })),
    update: vi.fn(() => ({ set: vi.fn((value: unknown) => ({ where: vi.fn(async () => updates.push(value)) })) })),
  };
}

describe("manager.createOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendTicketEmailMock.mockResolvedValue({ delivered: false });
  });

  it("creates a Flat Owner only for a unit in the Manager organization and links the unit", async () => {
    const db = createDb();
    getDbMock.mockResolvedValue(db);

    await expect(appRouter.createCaller(context("PROPERTY_MANAGER")).manager.createOwner({ name: "QA Owner", email: "owner.qa@maintainr.test", unitId: 22 })).resolves.toEqual({ success: true, userId: 44 });

    expect(db.inserts).toHaveLength(1);
    expect((db.inserts[0] as { value: { role?: string; organizationId?: number; unitId?: number } }).value).toMatchObject({ role: "FLAT_OWNER", organizationId: 7, unitId: 22 });
    expect(db.updates).toEqual([{ ownerId: 44 }]);
  });

  it("rejects a unit outside the Manager organization before it creates an account", async () => {
    const db = createDb({ unit: null });
    getDbMock.mockResolvedValue(db);

    await expect(appRouter.createCaller(context("PROPERTY_MANAGER")).manager.createOwner({ name: "QA Owner", email: "owner.qa@maintainr.test", unitId: 99 })).rejects.toThrow("Unit not found in your organization");
    expect(db.inserts).toHaveLength(0);
  });

  it("does not allow a non-Manager to provision an owner account", async () => {
    await expect(appRouter.createCaller(context("TENANT")).manager.createOwner({ name: "QA Owner", email: "owner.qa@maintainr.test", unitId: 22 })).rejects.toThrow("Manager role required");
  });
});


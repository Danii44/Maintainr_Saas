import { describe, expect, it } from "vitest";
import { Client } from "pg";

type DatabaseIdentity = { database: string; currentUser: string };

async function inspectDatabase(connectionString: string): Promise<DatabaseIdentity> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query<DatabaseIdentity>('select current_database() as database, current_user as "currentUser"');
    const identity = result.rows[0];
    if (!identity) throw new Error("Database identity query returned no row");
    return identity;
  } finally {
    await client.end().catch(() => undefined);
  }
}

describe("isolated Maintainr database connections", () => {
  it("connects to commercial/demo and SaaS databases without exposing connection values", async () => {
    const commercialUrl = process.env.COMMERCIAL_DATABASE_URL;
    const saasUrl = process.env.MAINTAINR_SAAS_DATABASE_URL;

    expect(commercialUrl, "COMMERCIAL_DATABASE_URL must be configured server-side").toMatch(/^postgres(?:ql)?:\/\//);
    expect(saasUrl, "MAINTAINR_SAAS_DATABASE_URL must be configured server-side").toMatch(/^postgres(?:ql)?:\/\//);

    const [commercial, saas] = await Promise.all([
      inspectDatabase(commercialUrl!),
      inspectDatabase(saasUrl!),
    ]);

    expect(commercial.database).toBeTruthy();
    expect(saas.database).toBeTruthy();
    expect(commercial.currentUser).toBeTruthy();
    expect(saas.currentUser).toBeTruthy();
  }, 30_000);
});

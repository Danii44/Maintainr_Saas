import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("disposable SaaS QA seed boundary", () => {
  it("uses only the dedicated SaaS database and retains teal/sky demo branding", async () => {
    const [seedRunner, seedSql] = await Promise.all([
      readFile(new URL("scripts/seed-saas-qa-accounts.mjs", root), "utf8"),
      readFile(new URL("database/qa/DEMO_ACCOUNTS_SEED.sql", root), "utf8"),
    ]);

    expect(seedRunner).toContain("process.env.MAINTAINR_SAAS_DATABASE_URL");
    expect(seedRunner).not.toContain("COMMERCIAL_DATABASE_URL");
    expect(seedSql).toContain("Maintainr disposable demo data for portal QA");
    expect(seedSql).toContain("'#0F766E', '#0EA5E9'");
    expect(seedSql).toContain("demo_manager_2026");
    expect(seedSql).toContain("demo_owner_2026");
  });
});

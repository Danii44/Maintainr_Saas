import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("standalone SaaS database selection", () => {
  it("prioritizes the dedicated SaaS database URL over a generic runtime URL", async () => {
    const databaseAdapter = await readFile(new URL("server/db.ts", root), "utf8");

    expect(databaseAdapter).toContain("process.env.MAINTAINR_SAAS_DATABASE_URL ?? process.env.DATABASE_URL");
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("operations message visibility", () => {
  it("keeps non-Manager conversation lists scoped to both their workspace and participant identity", async () => {
    const source = await readFile(new URL("server/operations.ts", root), "utf8");
    expect(source).toContain('innerJoin(conversationParticipants, eq(conversationParticipants.conversationId, conversations.id))');
    expect(source).toContain('eq(conversations.organizationId, organizationId), eq(conversationParticipants.userId, ctx.user.id)');
  });

  it("restores all disposable QA roles as seeded conversation participants on every idempotent run", async () => {
    const sql = await readFile(new URL("DEMO_ACCOUNTS_SEED.sql", root), "utf8");
    expect(sql).toContain('VALUES (v_conversation_id, v_manager_id), (v_conversation_id, v_tenant_id), (v_conversation_id, v_technician_id), (v_conversation_id, v_owner_id)');
    expect(sql).toContain('ON CONFLICT ("conversationId", "userId") DO NOTHING');
  });
});

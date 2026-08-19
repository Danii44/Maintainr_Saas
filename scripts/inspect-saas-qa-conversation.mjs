import pg from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Dedicated SaaS database configuration is unavailable.");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const summary = await client.query(`
    SELECT c.id AS conversation_id, c.subject, u.id AS participant_user_id, u."openId" AS participant_open_id, u.email, u.role
    FROM "conversations" c
    LEFT JOIN "conversationParticipants" cp ON cp."conversationId" = c.id
    LEFT JOIN "users" u ON u.id = cp."userId"
    WHERE c.subject = 'Demo kitchen tap access update'
    ORDER BY c.id, u.role
  `);
  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = '"conversationParticipants"'::regclass
    ORDER BY conname
  `);
  const tenantAccounts = await client.query(`
    SELECT id, "openId", email, role, "organizationId", "unitId"
    FROM "users"
    WHERE email = 'tenant.demo@maintainr.test' OR "openId" = 'demo_tenant_2026'
    ORDER BY id
  `);
  console.log(JSON.stringify({ participants: summary.rows, constraints: constraints.rows, tenantAccounts: tenantAccounts.rows }, null, 2));
} finally {
  await client.end();
}

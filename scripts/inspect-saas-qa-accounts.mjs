import { Client } from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL;

if (!connectionString) {
  throw new Error("MAINTAINR_SAAS_DATABASE_URL must be configured for QA-account inspection.");
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

try {
  await client.connect();

  const accounts = await client.query(`
    SELECT "role", count(*)::int AS "count"
    FROM "users"
    WHERE "openId" IN ('demo_manager_2026', 'demo_tenant_2026', 'demo_technician_2026', 'demo_owner_2026')
    GROUP BY "role"
    ORDER BY "role"
  `);
  const sampleTickets = await client.query(`
    SELECT count(*)::int AS "count"
    FROM "tickets"
    WHERE "title" = 'Demo leaking kitchen tap'
  `);
  const sampleReminders = await client.query(`
    SELECT count(*)::int AS "count"
    FROM "maintenanceReminders"
    WHERE "title" = 'Demo filter inspection'
  `);

  console.log(JSON.stringify({
    qaRoleCounts: accounts.rows,
    sampleTicketCount: sampleTickets.rows[0]?.count ?? 0,
    sampleReminderCount: sampleReminders.rows[0]?.count ?? 0,
  }, null, 2));
} finally {
  await client.end().catch(() => undefined);
}

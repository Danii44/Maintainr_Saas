import { readFile } from "node:fs/promises";
import { Client } from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL;

if (!connectionString) {
  throw new Error("MAINTAINR_SAAS_DATABASE_URL must be configured for QA-account seeding.");
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10_000,
});

try {
  await client.connect();
  const sql = await readFile(new URL("../database/qa/DEMO_ACCOUNTS_SEED.sql", import.meta.url), "utf8");
  await client.query(sql);
  console.log("Disposable SaaS QA accounts and sample workflow data are available.");
} finally {
  await client.end().catch(() => undefined);
}

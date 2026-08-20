import { Client } from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL;
if (!connectionString) throw new Error("Dedicated SaaS database configuration is unavailable.");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const tickets = await client.query(`
    SELECT id, title, status, "unitId", "submittedById", "createdAt"
    FROM tickets
    WHERE title IN ('Demo leaking kitchen tap', 'QA media evidence check', 'QA valid PNG evidence check')
    ORDER BY id;
  `);
  const evidence = await client.query(`
    SELECT e."ticketId", e."fileName", e."contentType", e.purpose, e."storageKey", e."createdAt"
    FROM "evidenceAssets" e
    INNER JOIN tickets t ON t.id = e."ticketId"
    WHERE t.title IN ('Demo leaking kitchen tap', 'QA media evidence check', 'QA valid PNG evidence check')
    ORDER BY e.id;
  `);
  const media = await client.query(`
    SELECT m."ticketId", m."mediaUrl", m."mediaType", m."createdAt"
    FROM "ticketMedia" m
    INNER JOIN tickets t ON t.id = m."ticketId"
    WHERE t.title IN ('Demo leaking kitchen tap', 'QA media evidence check', 'QA valid PNG evidence check')
    ORDER BY m.id;
  `);
  const audit = await client.query(`
    SELECT l."ticketId", l.action, l.message, l."createdAt"
    FROM "ticketLogs" l
    INNER JOIN tickets t ON t.id = l."ticketId"
    WHERE t.title IN ('Demo leaking kitchen tap', 'QA media evidence check', 'QA valid PNG evidence check')
    ORDER BY l."ticketId", l.id;
  `);
  console.log(JSON.stringify({ tickets: tickets.rows, evidenceAssets: evidence.rows, ticketMedia: media.rows, ticketLogs: audit.rows }, null, 2));
} finally {
  await client.end();
}

import { Client } from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL;
if (!connectionString) throw new Error("Dedicated SaaS database configuration is unavailable.");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const settings = await client.query(`
    SELECT d."projectName", d."projectNameArabic", d."emailNotificationsEnabled", d."smsNotificationsEnabled", d."updatedAt"
    FROM "developerSettings" d
    INNER JOIN organizations o ON o.id = d."organizationId"
    WHERE o.name = 'Maintainr QA Workspace — Delete After Validation'
    ORDER BY d.id
    LIMIT 1;
  `);
  const reminders = await client.query(`
    SELECT r.id, r.title, r."unitId", r."assignedToId", r."isActive", r."createdAt", count(a.id)::int AS acknowledgements
    FROM "maintenanceReminders" r
    LEFT JOIN "reminderAcknowledgements" a ON a."reminderId" = r.id
    INNER JOIN organizations o ON o.id = r."organizationId"
    WHERE o.name = 'Maintainr QA Workspace — Delete After Validation'
    GROUP BY r.id
    ORDER BY r.id;
  `);
  console.log(JSON.stringify({ settings: settings.rows[0] ?? null, reminders: reminders.rows }, null, 2));
} finally {
  await client.end();
}

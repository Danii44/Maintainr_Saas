import { Client } from "pg";

const connectionString = process.env.MAINTAINR_SAAS_DATABASE_URL;
if (!connectionString) throw new Error("Dedicated SaaS database configuration is unavailable.");
const qaManagerEmail = "manager.demo@maintainr.test";

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const settings = await client.query(`
    SELECT d."projectName", d."projectNameArabic", d."emailNotificationsEnabled", d."smsNotificationsEnabled", d."updatedAt"
    FROM "developerSettings" d
    INNER JOIN users manager ON manager."organizationId" = d."organizationId"
    WHERE manager.email = $1 AND manager.role = 'PROPERTY_MANAGER'
    ORDER BY d.id
    LIMIT 1;
  `, [qaManagerEmail]);
  const reminders = await client.query(`
    SELECT r.id, r.title, r."unitId", r."assignedToId", r."isActive", r."createdAt", count(a.id)::int AS acknowledgements
    FROM "maintenanceReminders" r
    LEFT JOIN "reminderAcknowledgements" a ON a."reminderId" = r.id
    INNER JOIN users manager ON manager."organizationId" = r."organizationId"
    WHERE manager.email = $1 AND manager.role = 'PROPERTY_MANAGER'
    GROUP BY r.id
    ORDER BY r.id;
  `, [qaManagerEmail]);
  console.log(JSON.stringify({ qaManagerEmail, settings: settings.rows[0] ?? null, reminders: reminders.rows }, null, 2));
} finally {
  await client.end();
}

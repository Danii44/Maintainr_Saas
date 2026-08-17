# Commercial-site handoff

The commercial website is a separate project at `Danii44/Maintainr_commercial`.

Set `COMMERCIAL_SITE_URL` in this SaaS deployment if you add links back to product information or quotations. The commercial site should set `SAAS_APP_URL` to this application’s public HTTPS URL. This link is a normal browser navigation only; it must not carry a database URL, access token, session cookie, organization identifier, or customer data.

The commercial demo is isolated from Maintainr SaaS. It is not a source of production user accounts, tickets, media, reminders, or workspace records.

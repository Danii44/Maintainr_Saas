# Maintainr Release Verification

**Verification date:** 17 August 2026  
**Environment:** Managed Maintainr development preview  
**Automated result:** TypeScript validation passed; 12 Vitest files passed; 39 tests passed.

## Automated evidence

| Area | Evidence | Result |
|---|---|---|
| Authentication | `server/auth.flow.test.ts`, `server/auth.logout.test.ts` | Passed |
| Role and portal authorization | `server/maintenance.access.test.ts`, `server/manager.actions.test.ts` | Passed |
| Ticket lifecycle and completion guards | `server/maintenance.rules.test.ts`, `server/ticketMutationRules.test.ts`, `server/ticketMutations.test.ts` | Passed |
| Ticket creation audit logging | `server/ticketMutations.test.ts` | Passed |
| Media upload and failure handling | `server/mediaUpload.test.ts`, `server/workflow.verification.test.ts` | Passed |
| Notifications and disabled channel defaults | `server/notifications.test.ts`, `server/reminders.rules.test.ts` | Passed |
| Reminder scheduling and deduplication | `server/reminderScheduler.test.ts`, `server/reminders.rules.test.ts` | Passed |
| Reminder CRUD, scoped lists, acknowledgements, settings authorization, and bilingual errors | `server/ticketMutations.test.ts` | Passed |

## Route smoke checks

The following routes were captured at the desktop preview viewport: `/`, `/sign-in`, `/sign-up`, `/join-unit`, `/manager`, `/tenant`, `/technician`, and `/owner`.

The public landing, authentication, and six-digit unit-code onboarding surfaces rendered in Arabic RTL mode with translated headings, actions, help text, and consistent dark responsive styling. The protected role paths correctly enforced access control in the unauthenticated preview: the manager route rendered the available manager preview session, while tenant, technician, and owner routes displayed the localized unavailable/role-protected state when no matching authenticated role session was present.

## Release checklist status

The implementation includes exact role routing for `PROPERTY_MANAGER`, `TENANT`, `TECHNICIAN`, and `FLAT_OWNER`; protected developer settings; reminder CRUD; role-scoped reminder lists; reminder acknowledgement; organization scoping; ticket lifecycle enforcement; mandatory technician proof and notes; multi-file tenant media handling with retry state; email/SMS toggles; bilingual project branding; Arabic RTL support; and scheduled reminder execution with occurrence deduplication.

## Remaining human acceptance checks

A project owner must still test the production deployment with real authenticated accounts for all four roles. The preview cannot independently prove provider delivery, DNS verification, production callback execution, or a real S3 upload against production credentials. Those checks are listed in `MAINTAINR_INSTALLATION_GUIDE.md` and must be completed after secrets, domain, and provider accounts are configured.

## Release conclusion

The codebase is suitable for a controlled production publish after the human acceptance checks above. No automated test failure or TypeScript error was observed in this verification pass.

---

## 18 August 2026 standalone SaaS theme release

The standalone `Danii44/Maintainr_Saas` production branch now contains the light-default portal release in commits `0cfd0f7` and `1c24202`. The root application no longer forces a dark theme; `ThemeProvider` now starts from the persisted preference resolver, which returns light mode when no preference has been stored. The accessible floating selector remains available to switch to dark mode and saves the user preference under `maintainr-theme`.

| Check | Evidence | Result |
|---|---|---|
| Theme regression coverage | `tests/theme-preference.test.ts` | Passed: default is light and an explicit stored dark preference is restored. |
| Full standalone test suite | `pnpm test` | Passed: 19 test files and 59 tests. |
| Netlify production build | `pnpm build:netlify` | Passed: Vite client build and both Netlify functions completed. |
| Published theme bundle | `https://maintainr-saas.netlify.app/` | The production bundle includes the persistent `maintainr-theme` logic and the theme selector. |
| Public SaaS paths | `/`, `/sign-in`, `/create-workspace` | Reached successfully through production page extraction. With no stored preference, the control reads `Dark`, indicating that the current page is in light mode and offers dark mode as the alternative. |
| Commercial separation | `https://maintainr-commercial.netlify.app/`, `/demo`, and both quotation intents | Public pages remain reachable and describe the separate fictional demo, quotation database, and private SaaS workspace boundary. The commercial site remains intentionally dark. |

The remaining release gates are unchanged: complete authenticated production QA with a deliberately provisioned account for each of `PROPERTY_MANAGER`, `TENANT`, `TECHNICIAN`, and `FLAT_OWNER`; verify cross-role ticket, media, reminder, and branding synchronization; and carry out provider-dependent checks only with the owner’s authorized credentials. A transient response timeout occurred while polling the public API health endpoint, so this entry intentionally does not claim a fresh API-health confirmation from that check.

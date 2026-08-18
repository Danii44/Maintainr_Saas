# Maintainr QA and Publication Status

Updated: 18 August 2026

## Live QA evidence

The live standalone SaaS at `https://maintainr-saas.netlify.app` now has a clearly labelled disposable workspace named **Maintainr QA Workspace — Delete After Validation**. Its disposable property and unit are also explicitly labelled for deletion after QA. Four isolated accounts exist with the expected roles: `PROPERTY_MANAGER`, `TENANT`, `TECHNICIAN`, and `FLAT_OWNER`.

The following live workflow has been verified through distinct authenticated sessions: the QA Tenant created ticket `1`; the QA Manager assigned it to the QA Technician; the QA Technician moved it to `IN_PROGRESS` and completed it with QA resolution evidence; and the Manager, Tenant, Technician, and Owner sessions all subsequently returned the ticket with `RESOLVED` status. A disposable reminder `1` was created by the QA Manager, appeared in the Tenant session with `isAcknowledged: false`, and was acknowledged successfully by that Tenant.

## Pending publication blocker

The standalone SaaS source contains an additional local commit, `b7e2650` (`fix: refine light portal surfaces`), that improves the light-mode Manager header and onboarding checklist treatment. The commit passed the full local suite (**21 test files / 67 tests**) and `pnpm build:netlify`, but it has not been pushed because the task’s GitHub CLI token became invalid. The browser remains authenticated to `https://github.com/Danii44/Maintainr_Saas`, which currently shows remote commit `30639d0` as its latest commit. GitHub authorization must be refreshed before pushing the pending commit and later commercial-site updates.

## Security note

The QA accounts and all related records are disposable test data. Do not use them for customers; delete the QA organization and its dependent records after the release verification is complete.

## Published release monitoring

GitHub authorization was restored and the standalone SaaS main branch was pushed through commit `72d8fa1`; the commercial main branch was pushed through commit `27ee601`. Netlify showed the SaaS production deployment for `72d8fa1` as **Building**, with the prior `30639d0` production release still published. During this build window, command-line requests to both public domains temporarily returned HTTP 500. The deployment status must be rechecked after the build completes before treating the live release as verified.

The commercial dashboard subsequently confirmed **Published main@27ee601** (`feat: expand animated commercial product story`) in 31 seconds. The SaaS dashboard still displayed `72d8fa1` as Building at the prior check, so only the commercial release can currently be treated as live-verified.

The follow-up SaaS security release is now live: Netlify confirmed **Published main@4a84ccc** (`fix: scope owner tickets to assigned unit`) in 26 seconds. The authorization correction is covered by the standalone test suite, which now passes 68 tests.

## Live light and RTL evidence

The published sign-in route was captured in its default light mode at a 1440-pixel English desktop viewport and a 390-pixel Arabic RTL mobile viewport. Both retain readable pale surfaces, clear hierarchy, responsive form controls, bilingual content, and the accessible floating optional-dark selector. No dark default surface is present; the control offers dark mode only as an explicit user preference.

An authenticated production Manager portal capture confirms the live light-default dashboard renders the shared workspace shell, bilingual control, profile navigation, Manager checklist, secure account-access panel, unit setup tools, and floating optional-dark selector without a dark default surface.

Netlify confirmed **Published main@eff884b** (`fix: remove dark tenant surface in light mode`) in 21 seconds. The Tenant light-surface correction is therefore available for live authenticated visual revalidation.

The corrected Tenant capture confirms the active-request workflow card is now a pale cyan-to-slate operational surface with readable status progression, request form, history panel, reminders, and the optional-dark selector. The authenticated Technician capture likewise shows a light work queue, assigned-job detail, completion checklist, profile navigation, and optional-dark selector; no dark default panels appear in either role portal.

The retained live Owner and Manager captures were re-inspected after the Tenant correction. The Owner overview shows a pale reminder panel, white operational metrics, and a readable portfolio-activity card. The Manager setup, account-access, and unit-provisioning surfaces use pale neutral/cyan panels with legible controls. Across all four authenticated roles, no residual dark dashboard-gradient card remains while light mode is selected.

The capture helper was allowed a longer settle period and a refreshed production Manager screenshot confirmed the live portal fully resolves from its loading state into the same readable light dashboard. The expanded wait is limited to the internal QA helper and does not change product runtime behavior.

The refreshed live Tenant portal retains a pale cyan-to-slate active-request surface, legible status steps, a clear issue-report entry point, reminder acknowledgement state, maintenance history, and the optional-dark selector. No dark gradient card is present in default light mode.

The refreshed live Technician portal presents an off-white assigned-work queue, pale completion workflow, readable ticket metadata, profile navigation, and the optional-dark selector. The refreshed Owner portal presents pale reminders, white metric cards, a readable portfolio record, and the optional-dark selector. The final live desktop captures confirm all four QA roles load their expected light portal without a residual dark dashboard-gradient surface.

The standalone SaaS regression suite was re-run after the live visual checks: **21 test files and 68 tests passed**. No product-source correction was warranted because the updated production captures and the automated suite both support the light-mode implementation.

Arabic RTL mobile captures at 390 pixels confirm that the Manager checklist and Tenant issue-report workflow reverse and stack correctly, retain light surfaces, preserve readable Arabic hierarchy, and leave the floating dark selector reachable. The abbreviated English fragment in the Tenant reminder is a deliberately English-labelled disposable QA record title rather than unlocalized product interface text.

The Technician and Owner Arabic RTL mobile captures show the same correct right-to-left hierarchy, mobile navigation, light operational cards, and accessible dark selector. Work-ticket titles remain English only where they are disposable QA record content; product labels, statuses, actions, metrics, and supporting instructions render in Arabic.

The Manager portal was then verified with a stored dark preference across a fresh portal load. The persisted dark capture shows the inverse **Light** control, and a follow-up stored-light capture restored the light portal and **Dark** control. The selector is implemented as a native `button` with a state-specific accessible name, so it remains keyboard-operable; its theme choice persists through the `maintainr-theme` local-storage key.

The standalone `pnpm build:netlify` production build also completed successfully after this live QA pass. Vite emitted an advisory about a large JavaScript chunk, but it did not fail the build and is a performance-refinement opportunity rather than a release blocker.

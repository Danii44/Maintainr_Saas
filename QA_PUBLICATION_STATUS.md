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

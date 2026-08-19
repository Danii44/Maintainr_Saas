# Dashboard Reference Notes

The supplied Workload page is used only as a layout and interaction reference. Maintainr will not reuse its branding, labels, sample data, artwork, or source code.

The useful patterns to adapt are a compact persistent sidebar, a clear top workspace bar with search and utility controls, a profile entry point, structured metric cards, a focused primary work panel, and a complementary right-side operational panel. In Maintainr, these patterns will be translated to property-maintenance concepts: request status, assignments, reminders, recent activity, role-aware quick actions, and a single profile/settings destination.

The implementation must preserve Maintainr’s teal and sky identity, English/Arabic RTL support, role authorization, live tRPC data flows, and the existing light-default with optional dark-mode behavior.

## Local Verification Notes

The locally running SaaS sign-in screen remains responsive and light-first after the portal-shell refinement. The new shared shell is source-validated with role-specific navigation, a profile route, reminder access, active-link styling, and RTL sidebar positioning. Authenticated dashboard rendering still requires a configured local PostgreSQL workspace; no production or Netlify environment was accessed for this verification.

The local commercial `/experience` route was rechecked after the Try demo conversion change. Its entry action reaches the interactive workspace anchor, and switching from Property Manager to Resident updates the safe browser-session portal view. No customer account, production record, or Netlify deployment was used.

The Workload reference was reconfirmed on the supplied public URL. Its relevant original-layout concepts remain a left workspace rail, a top utility and profile bar, concise metric panels, and a main operational-content region. Maintainr retains only those general composition principles while using separate property-maintenance labels, role-safe navigation, teal identity, data model, and source code.

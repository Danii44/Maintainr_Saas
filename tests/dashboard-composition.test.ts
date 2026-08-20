import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("Maintainr dashboard composition", () => {
  it("keeps the role-safe portal shell with navigation and a profile entry point", async () => {
    const app = await readFile(new URL("client/src/App.tsx", root), "utf8");

    expect(app).toContain("function AppShell");
    expect(app).toContain('href="/profile"');
    expect(app).toContain("Workspace ready");
    expect(app).toContain("navItems");
    expect(app).toContain("overflow-y-auto overscroll-contain");
    expect(app).toContain("pb-24");
  });

  it("keeps the comprehensive Maintainr Atlas portal system and RTL sidebar behavior", async () => {
    const styles = await readFile(new URL("client/src/index.css", root), "utf8");

    expect(styles).toContain("Maintainr Atlas: an original property-operations system");
    expect(styles).toContain("aside.fixed.inset-y-0");
    expect(styles).toContain("main.lg\\:pl-72 > header");
    expect(styles).toContain('header a[aria-label="Open profile"]');
    expect(styles).toContain('html[dir="rtl"] aside.fixed.inset-y-0');
    expect(styles).toContain("--maintainr-canvas");
    expect(styles).toContain("--maintainr-text-on-dark");
    expect(styles).toContain("--maintainr-text-on-dark-muted");
    expect(styles).toContain('[class*="bg-cyan-400"]:not([class*="bg-cyan-400/"])');
    expect(styles).toContain('[class*="bg-violet-400/[.03]"]');
    expect(styles).toContain("#ticket-operations");
    expect(styles).toContain("xl:grid-cols-4");
    expect(styles).toContain("Manrope");
    expect(styles).toContain("Noto Kufi Arabic");
    expect(styles).toContain("Evergreen rail");
    expect(styles).toContain("Optional dark mode is redesigned");
    expect(styles).toContain("@media (max-width: 1023px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("Stronger form and table affordances");
    expect(styles).toContain("aside.fixed.inset-y-0 .text-slate-300");
    expect(styles).toContain("--maintainr-field");
    expect(styles).toContain("--maintainr-placeholder");
    expect(styles).toContain('aside.fixed.inset-y-0 .text-slate-100');
    expect(styles).toContain('main.lg\\:pl-72 :is(input, textarea)::placeholder');
    expect(styles).toContain("maintainr-operations-overlay");
    expect(styles).toContain("scrollbar-gutter: stable");
    expect(styles).toContain("Home hero evidence");
    expect(styles).toContain('[class*="bg-teal-400/10"][class*="text-teal-200"]');
    expect(styles).toContain('[class*="bg-[#101521]"] [class*="text-slate-500"]');
    expect(styles).toContain("maintainr-next-focus");
  });

  it("keeps Manager reminder editing behind the protected operations overlay", async () => {
    const overlay = await readFile(new URL("client/src/operationsOverlay.tsx", root), "utf8");

    expect(overlay).toContain('"reminders"');
    expect(overlay).toContain("function RemindersPanel");
    expect(overlay).toContain("trpc.reminders.update.useMutation");
    expect(overlay).toContain('view === "reminders" && role !== "PROPERTY_MANAGER"');
    expect(overlay).toContain('t("Save changes", "حفظ التغييرات")');
  });

  it("keeps query-driven workspaces escapable and message threads independently scrollable", async () => {
    const overlay = await readFile(new URL("client/src/operationsOverlay.tsx", root), "utf8");

    expect(overlay).toContain("Back to overview");
    expect(overlay).toContain("navigate(pathname)");
    expect(overlay).toContain("overflow-y-auto overscroll-contain");
    expect(overlay).toContain("xl:h-[clamp(32rem,calc(100dvh-18rem),44rem)]");
    expect(overlay).toContain("min-h-0 flex-1 flex-col");
    expect(overlay).toContain("maintainr-next-focus");
  });

  it("keeps Manager setup and administration out of the daily overview until People is opened", async () => {
    const app = await readFile(new URL("client/src/App.tsx", root), "utf8");
    const accessTools = await readFile(new URL("client/src/pages/ManagerAccessTools.tsx", root), "utf8");
    const applications = await readFile(new URL("client/src/pages/ManagerApplicationsPanel.tsx", root), "utf8");
    const checklist = await readFile(new URL("client/src/components/WorkspaceSetupChecklist.tsx", root), "utf8");

    expect(app).toContain("ManagerAccessTools");
    expect(app).toContain("WorkspaceSetupChecklist");
    expect(app).toContain("configuredName");
    expect(app).toContain("sync check");
    expect(accessTools).toContain("isPeopleRoute");
    expect(accessTools).toContain("if (!isPeopleRoute) return null");
    expect(applications).toContain("if (!isPeopleRoute || applications.isLoading || pending.length === 0) return null");
    expect(checklist).toContain("maintainr-setup-checklist-dismissed");
    expect(checklist).toContain('t("Dismiss", "إخفاء")');
  });

  it("keeps Manager ticket actions in the dedicated Tickets workspace rather than inline controls on overview cards", async () => {
    const app = await readFile(new URL("client/src/App.tsx", root), "utf8");
    const overlay = await readFile(new URL("client/src/operationsOverlay.tsx", root), "utf8");
    const styles = await readFile(new URL("client/src/index.css", root), "utf8");

    expect(app).toContain('href="/manager?view=tickets"');
    expect(app).toContain('t("Assign", "تعيين")');
    expect(overlay).toContain('"tickets"');
    expect(overlay).toContain("function TicketsPanel");
    expect(overlay).toContain("Daily overview stays clear");
    expect(styles).toContain("font-size: clamp(1.5rem, 2vw, 1.95rem)");
  });
});

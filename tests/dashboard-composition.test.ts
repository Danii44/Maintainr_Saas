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
  });
});

import { describe, expect, it } from "vitest";
import { resolvePortalTheme } from "../client/src/lib/themePreference";

describe("portal theme preference", () => {
  it("uses the professional light interface by default", () => {
    expect(resolvePortalTheme(null)).toBe("light");
    expect(resolvePortalTheme("unexpected-value")).toBe("light");
  });

  it("restores a visitor-selected dark theme", () => {
    expect(resolvePortalTheme("dark")).toBe("dark");
  });
});

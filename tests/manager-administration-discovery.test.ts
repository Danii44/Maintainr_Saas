import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("Manager administration discovery", () => {
  it("keeps profile, account-access, people, and technician controls reachable through the Manager portal", async () => {
    const [app, profile, accessTools] = await Promise.all([
      readFile(new URL("client/src/App.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/ProfilePage.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/ManagerAccessTools.tsx", root), "utf8"),
    ]);

    expect(app).toContain('label: t("People", "الأشخاص")');
    expect(app).toContain('label: t("Profile", "الملف الشخصي")');
    expect(app).toContain('get("view") === "people"');
    expect(app).toContain("<ManagerAccessTools/>");
    expect(app).toContain("<ManagerTicketActions");
    expect(profile).toContain("updateProfile.mutateAsync");
    expect(profile).toContain("changePassword.mutateAsync");
    expect(accessTools).toContain("sendPasswordReset");
    expect(accessTools).toContain("createOwner");
    expect(app).toContain("createTenant.mutateAsync");
    expect(app).toContain("inviteTechnician.mutateAsync");
  });
});

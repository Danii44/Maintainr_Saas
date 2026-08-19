import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url);

describe("post-auth navigation guards", () => {
  it("does not read a nullable authentication result before routing", async () => {
    const source = await readFile(new URL("client/src/App.tsx", root), "utf8");

    expect(source).toContain('if (!result) throw new Error(t("Authentication did not return an account."');
    expect(source.indexOf("if (!result)")).toBeLessThan(source.indexOf("const destination = result.role"));
  });

  it("does not read a nullable workspace-creation result before routing", async () => {
    const source = await readFile(new URL("client/src/pages/WorkspaceSignupPage.tsx", root), "utf8");

    expect(source).toContain('if (!user) throw new Error(t("Workspace creation did not return an account."');
    expect(source.indexOf("if (!user)")).toBeLessThan(source.indexOf("navigate(user.role"));
  });
});

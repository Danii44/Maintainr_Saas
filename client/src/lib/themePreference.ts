export type PortalTheme = "light" | "dark";

export function resolvePortalTheme(storedValue: string | null): PortalTheme {
  return storedValue === "dark" ? "dark" : "light";
}

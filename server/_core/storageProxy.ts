import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

function readStorageKey(params: { key?: string | string[] }) {
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key;
  if (!key || key.split("/").some((segment) => !segment || segment === "." || segment === "..")) return undefined;
  return key;
}

export function registerStorageProxy(app: Express) {
  app.get("/storage/*key", async (req, res) => {
    const key = readStorageKey(req.params as { key?: string | string[] });
    if (!key) return res.status(400).send("Missing or invalid storage key");
    try {
      res.set("Cache-Control", "private, max-age=300");
      res.redirect(307, await storageGetSignedUrl(key));
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage backend error");
    }
  });

  app.get("/media/*key", async (req, res) => {
    const key = readStorageKey(req.params as { key?: string | string[] });
    if (!key) return res.status(400).send("Missing or invalid media key");
    try {
      res.set("Cache-Control", "private, max-age=300");
      res.redirect(307, await storageGetSignedUrl(key));
    } catch (err) {
      console.error("[MediaProxy] failed:", err);
      res.status(502).send("Media backend error");
    }
  });
}

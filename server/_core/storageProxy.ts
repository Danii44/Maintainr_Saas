import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  app.get("/storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) return res.status(400).send("Missing storage key");
    try {
      res.set("Cache-Control", "private, max-age=300");
      res.redirect(307, await storageGetSignedUrl(key));
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage backend error");
    }
  });

  app.get("/media/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) return res.status(400).send("Missing media key");
    try {
      res.set("Cache-Control", "private, max-age=300");
      res.redirect(307, await storageGetSignedUrl(key));
    } catch (err) {
      console.error("[MediaProxy] failed:", err);
      res.status(502).send("Media backend error");
    }
  });
}

import express from "express";
import { createServer } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handlePortableMaintenanceReminder } from "../reminderScheduler";
import { registerHealthRoutes } from "../health";

export function createApp() {
  const app = express();
  const server = createServer(app);
  if (process.env.NODE_ENV === "production") {
    app.use((_req, res, next) => {
      res.set({
        "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; script-src 'self' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; media-src 'self' https:; upgrade-insecure-requests",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      });
      next();
    });
  }
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerHealthRoutes(app);
  app.post("/api/scheduled/maintenanceReminder", handlePortableMaintenanceReminder);
  app.post("/api/scheduled/portableMaintenanceReminder", handlePortableMaintenanceReminder);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return { app, server };
}

import express from "express";
import { createServer } from "node:http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handlePortableMaintenanceReminder } from "../reminderScheduler";
import { registerHealthRoutes } from "../health";
import { handleResendDeliveryWebhook, handleTwilioDeliveryWebhook } from "../providerWebhooks";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  const server = createServer(app);
  if (process.env.NODE_ENV === "production") {
    app.use((_req, res, next) => {
      res.set({
        "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; script-src 'self' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; media-src 'self' https:; upgrade-insecure-requests",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-site",
        "Origin-Agent-Cluster": "?1",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      });
      next();
    });
  }
  app.use("/api", (_req, res, next) => {
    res.set({ "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" });
    next();
  });
  app.post("/api/webhooks/resend", express.raw({ type: "application/json", limit: "1mb" }), handleResendDeliveryWebhook);
  app.post("/api/webhooks/twilio", express.urlencoded({ extended: false, limit: "1mb" }), handleTwilioDeliveryWebhook);
  // Avatar uploads are capped at 5 MB after base64 decoding; keep the transport allowance bounded accordingly.
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ limit: "128kb", extended: true }));
  registerStorageProxy(app);
  registerHealthRoutes(app);
  app.post("/api/scheduled/maintenanceReminder", handlePortableMaintenanceReminder);
  app.post("/api/scheduled/portableMaintenanceReminder", handlePortableMaintenanceReminder);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return { app, server };
}

import type { Request, Response } from "express";
import twilio from "twilio";
import { Webhook } from "svix";

type ResendEvent = {
  type?: string;
  data?: { email_id?: string; message_id?: string };
};

type TwilioStatus = {
  MessageSid?: string;
  MessageStatus?: string;
  ErrorCode?: string;
};

function rawBody(req: Request) {
  return Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
}

function publicWebhookUrl(req: Request) {
  const configuredBase = process.env.NOTIFICATION_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (configuredBase) return `${configuredBase}${req.originalUrl}`;
  const protocol = (req.header("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  return `${protocol}://${req.get("host")}${req.originalUrl}`;
}

export function handleResendDeliveryWebhook(req: Request, res: Response) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "resend-webhook-not-configured" });

  const payload = rawBody(req);
  const id = req.header("svix-id");
  const timestamp = req.header("svix-timestamp");
  const signature = req.header("svix-signature");
  if (!payload || !id || !timestamp || !signature) return res.status(400).json({ error: "invalid-resend-webhook" });

  try {
    const event = new Webhook(secret).verify(payload, { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": signature }) as ResendEvent;
    console.info("[Resend webhook] accepted", { type: event.type ?? "unknown", emailId: event.data?.email_id ?? null, messageId: event.data?.message_id ?? null });
    return res.status(204).end();
  } catch {
    return res.status(400).json({ error: "invalid-resend-signature" });
  }
}

export function handleTwilioDeliveryWebhook(req: Request, res: Response) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.header("x-twilio-signature");
  if (!authToken) return res.status(503).json({ error: "twilio-webhook-not-configured" });
  if (!signature) return res.status(400).json({ error: "invalid-twilio-webhook" });

  const valid = twilio.validateRequest(authToken, signature, publicWebhookUrl(req), req.body as Record<string, string>);
  if (!valid) return res.status(403).json({ error: "invalid-twilio-signature" });

  const status = req.body as TwilioStatus;
  console.info("[Twilio webhook] accepted", { messageSid: status.MessageSid ?? null, messageStatus: status.MessageStatus ?? null, errorCode: status.ErrorCode ?? null });
  return res.status(204).end();
}

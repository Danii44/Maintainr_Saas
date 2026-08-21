import { afterEach, describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { handleResendDeliveryWebhook, handleTwilioDeliveryWebhook } from "./providerWebhooks";

type Capture = { statusCode: number; payload: unknown; ended: boolean };

function responseCapture() {
  const capture: Capture = { statusCode: 200, payload: undefined, ended: false };
  const response = {
    status(code: number) { capture.statusCode = code; return response; },
    json(payload: unknown) { capture.payload = payload; return response; },
    end() { capture.ended = true; return response; },
  };
  return { capture, response: response as unknown as Response };
}

function requestStub(overrides: Partial<Request>) {
  return {
    body: {},
    protocol: "https",
    originalUrl: "/api/webhooks/provider",
    get: () => "maintainr.example",
    header: () => undefined,
    ...overrides,
  } as unknown as Request;
}

afterEach(() => {
  delete process.env.RESEND_WEBHOOK_SECRET;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.NOTIFICATION_WEBHOOK_BASE_URL;
});

describe("provider delivery webhooks", () => {
  it("fails closed when the Resend signing secret is not configured", () => {
    const { capture, response } = responseCapture();
    handleResendDeliveryWebhook(requestStub({ body: Buffer.from("{}") }), response);
    expect(capture).toMatchObject({ statusCode: 503, payload: { error: "resend-webhook-not-configured" } });
  });

  it("rejects an unsigned Twilio callback when credentials are configured", () => {
    process.env.TWILIO_AUTH_TOKEN = "unit-test-token";
    const { capture, response } = responseCapture();
    handleTwilioDeliveryWebhook(requestStub({ body: { MessageSid: "SM_unit", MessageStatus: "delivered" } }), response);
    expect(capture).toMatchObject({ statusCode: 400, payload: { error: "invalid-twilio-webhook" } });
  });

  it("rejects a Twilio callback with an invalid signature", () => {
    process.env.TWILIO_AUTH_TOKEN = "unit-test-token";
    const { capture, response } = responseCapture();
    handleTwilioDeliveryWebhook(requestStub({
      body: { MessageSid: "SM_unit", MessageStatus: "delivered" },
      header: (name: string) => name.toLowerCase() === "x-twilio-signature" ? "invalid" : undefined,
    }), response);
    expect(capture).toMatchObject({ statusCode: 403, payload: { error: "invalid-twilio-signature" } });
  });
});

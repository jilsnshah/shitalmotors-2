import "server-only";
import type { Lead } from "./schema";

export type DeliveryResult = { mode: "live" | "demo"; reference: string };

const reference = () => `SM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * Delivers a validated lead.
 *
 * - LEAD_WEBHOOK_URL set → POSTs JSON to it (a CRM, Zapier/Make, a Google
 *   Apps Script, a Slack workflow, or the dealership's DMS). If
 *   LEAD_WEBHOOK_SECRET is set it is sent as `x-lead-secret`.
 * - Otherwise → demo mode: the lead is logged on the server only and the UI
 *   tells the visitor it was not sent to the dealership.
 */
export async function deliverLead(lead: Lead, meta: { userAgent?: string | null; page?: string | null; attachment?: { name: string; type: string; size: number; base64: string } | null }): Promise<DeliveryResult> {
  const ref = reference();
  const payload = { reference: ref, receivedAt: new Date().toISOString(), source: "website", ...lead, website: undefined, meta: { userAgent: meta.userAgent, page: meta.page }, attachment: meta.attachment ?? undefined };

  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) {
    const { attachment, ...loggable } = payload;
    console.info("[leads:demo]", JSON.stringify({ ...loggable, attachment: attachment ? { name: attachment.name, size: attachment.size } : undefined }));
    return { mode: "demo", reference: ref };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.LEAD_WEBHOOK_SECRET ? { "x-lead-secret": process.env.LEAD_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Lead webhook responded ${res.status}`);
  return { mode: "live", reference: ref };
}

import { deliverLead } from "@/lib/leads/deliver";
import { fieldErrors, leadSchema, validateResume } from "@/lib/leads/schema";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/leads — accepts JSON for enquiry/booking forms, and
 * multipart/form-data for careers (resume upload).
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`lead:${ip}`, 8, 10 * 60_000)) {
    return Response.json({ ok: false, error: "Too many submissions. Please try again later or call us." }, { status: 429 });
  }

  let raw: Record<string, unknown> | null = null;
  let resume: File | null = null;
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("resume");
      resume = file instanceof File ? file : null;
      form.delete("resume");
      raw = Object.fromEntries(form.entries()) as Record<string, unknown>;
      raw.consent = raw.consent === "true" || raw.consent === "on";
    } else {
      raw = await request.json();
    }
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Please correct the highlighted fields.", fields: fieldErrors(parsed.error) }, { status: 422 });
  }

  // Bots fill the hidden honeypot; accept silently so they learn nothing.
  if (parsed.data.website) return Response.json({ ok: true, mode: "demo", reference: "SM-OK" });

  let attachment = null;
  if (parsed.data.type === "careers") {
    const problem = validateResume(resume);
    if (problem) return Response.json({ ok: false, error: problem, fields: { resume: problem } }, { status: 422 });
    attachment = { name: resume!.name, type: resume!.type, size: resume!.size, base64: Buffer.from(await resume!.arrayBuffer()).toString("base64") };
  }

  try {
    const result = await deliverLead(parsed.data, { userAgent: request.headers.get("user-agent"), page: request.headers.get("referer"), attachment });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[leads] delivery failed", error);
    return Response.json({ ok: false, error: "We couldn't send your request just now. Please call us or try again." }, { status: 502 });
  }
}

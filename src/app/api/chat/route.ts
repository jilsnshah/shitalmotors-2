import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ASSISTANT_INSTRUCTIONS, buildKnowledgeBase } from "@/lib/assistant/knowledge";
import { demoAnswer } from "@/lib/assistant/demo-engine";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/chat — streams the assistant's reply as plain UTF-8 text.
 *
 * Live mode (ANTHROPIC_API_KEY set): Claude, grounded in a knowledge base
 * built from the synced dealership content. Demo mode (no key): a rule-based
 * engine over the same content. The `x-assistant-mode` header tells the UI
 * which one answered so it can label demo responses honestly.
 */

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(24)
    .refine((m) => m.at(-1)?.role === "user", "The last message must be from the user."),
});

const MODEL = process.env.ASSISTANT_MODEL || "claude-opus-5-5";

// Built once per server instance; deterministic so the cached prefix never changes.
let knowledge: string | null = null;
let client: Anthropic | null = null;

const encoder = new TextEncoder();
const textHeaders = (mode: "live" | "demo") => ({
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-assistant-mode": mode,
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`chat:${ip}`, 20, 60_000)) {
    return Response.json({ error: "Too many messages. Please wait a minute and try again." }, { status: 429 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  // The API requires strictly alternating turns starting with the user.
  const messages = parsed.data.messages.filter((m, i, all) => (i === 0 ? m.role === "user" : m.role !== all[i - 1].role));

  if (!process.env.ANTHROPIC_API_KEY) return demoResponse(messages.at(-1)!.content);

  knowledge ??= buildKnowledgeBase();
  client ??= new Anthropic();

  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 2048,
      // Chat is latency-sensitive; low effort keeps answers quick and concise.
      output_config: { effort: "low" },
      // If a safety classifier declines, Anthropic re-runs the request on a recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: ASSISTANT_INSTRUCTIONS },
        { type: "text", text: `<knowledge_base>\n${knowledge}\n</knowledge_base>`, cache_control: { type: "ephemeral", ttl: "1h" } },
      ],
      messages,
    },
    { signal: request.signal },
  );

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wrote = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(`${wrote ? "\n\n" : ""}I can't help with that here. For anything about vehicles, prices, test drives or service, ask away — or call our team.`));
        } else if (!wrote) {
          controller.enqueue(encoder.encode("Sorry, I couldn't put an answer together. Please try rephrasing."));
        }
      } catch (error) {
        if (request.signal.aborted) return controller.close();
        console.error("[assistant]", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
        const msg =
          error instanceof Anthropic.RateLimitError
            ? "The assistant is busy right now. Please try again in a moment."
            : "The assistant is temporarily unavailable. You can still call us or use the contact form.";
        controller.enqueue(encoder.encode(`${wrote ? "\n\n" : ""}${msg}`));
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, { headers: textHeaders("live") });
}

/** Streams the demo answer in small chunks so the UI behaves exactly as in live mode. */
function demoResponse(question: string) {
  const answer = demoAnswer(question);
  const chunks = answer.match(/\S+\s*/g) ?? [answer];
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 0; i < chunks.length; i += 3) {
        controller.enqueue(encoder.encode(chunks.slice(i, i + 3).join("")));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
  return new Response(body, { headers: textHeaders("demo") });
}

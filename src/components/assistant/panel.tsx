"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles, Square, X, Phone } from "lucide-react";
import { Markdown } from "./markdown";

type Message = { id: string; role: "user" | "assistant"; content: string; error?: boolean };
type Mode = "live" | "demo" | null;

const STORAGE_KEY = "shital-assist:v1";
const SUGGESTIONS = [
  "Which SUVs start under ₹12 lakh?",
  "Compare XUV 7XO and Scorpio",
  "Thar ROXX diesel automatic prices",
  "Nearest workshop to Chandkheda",
  "What is Qwik Service?",
];

/** The panel only renders in the browser (loaded with ssr: false), so storage is available. */
function loadSaved(): { messages: Message[]; mode: Mode } {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as { messages?: Message[]; mode?: Mode };
      return { messages: data.messages ?? [], mode: data.mode ?? null };
    }
  } catch {}
  return { messages: [], mode: null };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function AssistantPanel({
  open,
  onClose,
  pendingPrompt,
  onPromptConsumed,
  salesPhone,
}: {
  salesPhone: { display: string; href: string };
  open: boolean;
  onClose: () => void;
  pendingPrompt?: string;
  onPromptConsumed: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(() => loadSaved().messages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>(() => loadSaved().mode);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Persist the conversation for this browser tab — including while a reply
  // streams, so a full page load mid-answer doesn't lose the latest exchange.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: messages.slice(-30), mode }));
    } catch {}
  }, [messages, mode]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Full-screen on phones: stop the page behind from scrolling.
    const mq = window.matchMedia("(max-width: 639px)");
    const prev = document.body.style.overflow;
    if (mq.matches) document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;
      const userMsg: Message = { id: uid(), role: "user", content };
      const reply: Message = { id: uid(), role: "assistant", content: "" };
      const history = [...messages.filter((m) => !m.error), userMsg];
      setMessages([...messages, userMsg, reply]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-16).map(({ role, content }) => ({ role, content })) }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Something went wrong.");
        }
        setMode((res.headers.get("x-assistant-mode") as Mode) ?? null);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => prev.map((m) => (m.id === reply.id ? { ...m, content: acc } : m)));
        }
      } catch (e) {
        if (controller.signal.aborted) {
          setMessages((prev) => prev.map((m) => (m.id === reply.id && !m.content ? { ...m, content: "_Stopped._", error: true } : m)));
        } else {
          const msg = e instanceof Error ? e.message : "Something went wrong.";
          setMessages((prev) => prev.map((m) => (m.id === reply.id ? { ...m, content: msg, error: true } : m)));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  // A question handed over from elsewhere on the site (e.g. a model page).
  // It arrives via a window event, so it's sent from a task rather than during the effect itself.
  useEffect(() => {
    if (!open || !pendingPrompt || streaming) return;
    const t = setTimeout(() => {
      onPromptConsumed();
      send(pendingPrompt);
    }, 0);
    return () => clearTimeout(t);
  }, [open, pendingPrompt, streaming, send, onPromptConsumed]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setMode(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    inputRef.current?.focus();
  };

  const closeOnMobileNav = () => {
    if (window.matchMedia("(max-width: 639px)").matches) onClose();
  };

  return (
    <section
      id="assistant-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Shital Assist — chat"
      hidden={!open}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(44rem,calc(100dvh-3rem))] sm:w-[25.5rem] sm:rounded-[1.75rem] sm:border sm:border-line sm:shadow-float"
      style={{ animation: open ? "rise 0.45s var(--ease-out-quint) both" : undefined }}
    >
      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-line px-4 py-3.5">
        <div className="relative grid size-10 place-items-center rounded-2xl bg-ink text-white">
          <Sparkles aria-hidden className="size-[18px]" />
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-surface" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.98rem] font-semibold leading-tight [font-variation-settings:'wdth'_110]">Shital Assist</p>
          <p className="truncate text-xs text-muted">AI assistant · answers from our published info</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={reset} className="grid size-9 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label="Start a new conversation" title="New conversation">
            <RotateCcw className="size-4" />
          </button>
        )}
        <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close chat">
          <X className="size-5" />
        </button>
      </div>

      {mode === "demo" && (
        <p className="border-b border-line bg-warning-soft px-4 py-2 text-xs text-warning">
          <strong className="font-semibold">Demo mode.</strong> Answers come from a rule-based engine over this site&apos;s content. Add an API key to enable the AI model.
        </p>
      )}

      {/* Conversation */}
      <div ref={logRef} role="log" aria-live="polite" aria-relevant="additions text" className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5">
        {messages.length === 0 && (
          <div className="animate-rise">
            <div className="rounded-2xl bg-sunken p-4">
              <p className="font-medium">Hi! I&apos;m Shital Assist.</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                Ask me about Mahindra models, variants and ex-showroom prices, our showrooms and workshops, or how to book a test drive or service.
              </p>
            </div>
            <p className="eyebrow mb-2.5 mt-6">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-surface px-3.5 py-2 text-left text-sm text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.94rem] leading-relaxed text-white">{m.content}</p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-sunken text-ink">
                <Sparkles className="size-3.5" />
              </div>
              <div className={`min-w-0 flex-1 text-[0.94rem] leading-relaxed ${m.error ? "text-muted" : "text-ink-2"}`}>
                {m.content ? (
                  <Markdown text={m.content} onNavigate={closeOnMobileNav} />
                ) : (
                  <span className="inline-flex gap-1 py-2" aria-label="Assistant is typing">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="size-1.5 animate-pulse-dot rounded-full bg-subtle" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line bg-surface px-3 pb-3 pt-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-canvas p-1.5 transition-colors focus-within:border-ink/40 focus-within:bg-surface">
          <label htmlFor="assistant-input" className="sr-only">Message</label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={2000}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about models, prices, outlets…"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[0.95rem] outline-none placeholder:text-subtle focus-visible:outline-none"
          />
          {streaming ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-white" aria-label="Stop generating">
              <Square className="size-3.5 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white transition-opacity disabled:opacity-30" aria-label="Send message">
              <ArrowUp className="size-4.5" />
            </button>
          )}
        </div>
        <p className="mt-2 flex items-center justify-between gap-2 px-1 text-[0.7rem] text-subtle">
          <span>AI can make mistakes. Confirm prices with the showroom.</span>
          <a href={salesPhone.href} className="inline-flex shrink-0 items-center gap-1 font-medium text-muted hover:text-ink">
            <Phone aria-hidden className="size-3" /> {salesPhone.display}
          </a>
        </p>
      </form>
    </section>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ASSISTANT_EVENT } from "./open-assistant";

// The panel (and its markdown renderer) only downloads when first opened.
const AssistantPanel = dynamic(() => import("./panel").then((m) => m.AssistantPanel), { ssr: false });

export function AssistantLauncher({ salesPhone }: { salesPhone: { display: string; href: string } }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<string | undefined>();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const show = useCallback((prompt?: string) => {
    setLoaded(true);
    setOpen(true);
    if (prompt) setPending(prompt);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => show((e as CustomEvent<{ prompt?: string }>).detail?.prompt);
    window.addEventListener(ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(ASSISTANT_EVENT, onOpen);
  }, [show]);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : show())}
        onPointerEnter={() => setLoaded(true)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className={`fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2.5 rounded-full bg-ink pl-4 pr-5 text-white shadow-float transition-[transform,opacity] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-0.5 md:bottom-6 md:right-6 ${
          open ? "pointer-events-none translate-y-3 opacity-0 max-sm:hidden" : "opacity-100"
        }`}
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-white/10">
          <Sparkles aria-hidden className="size-4" />
          <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-ink" />
        </span>
        <span className="text-sm font-medium">
          Ask Shital Assist
        </span>
      </button>
      {loaded && <AssistantPanel salesPhone={salesPhone} open={open} onClose={close} pendingPrompt={pending} onPromptConsumed={() => setPending(undefined)} />}
    </>
  );
}

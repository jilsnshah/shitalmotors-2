"use client";

import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { openAssistant } from "./open-assistant";

/** Opens Shital Assist, optionally with a question already asked. */
export function AskAssistantButton({ prompt, children, className = "", variant = "secondary" }: { prompt?: string; children: ReactNode; className?: string; variant?: "secondary" | "dark" | "ghost" }) {
  return (
    <button type="button" onClick={() => openAssistant(prompt)} className={buttonClass(variant, "lg", className)}>
      {children}
    </button>
  );
}

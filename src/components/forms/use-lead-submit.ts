"use client";

import { useState } from "react";
import type { ZodType } from "zod";
import { fieldErrors } from "@/lib/leads/schema";

type Result = { mode: "live" | "demo"; reference: string };

/**
 * Validates with the shared zod schema, then posts to /api/leads.
 * Server-side field errors are merged back into the same error map.
 */
export function useLeadSubmit(schema: ZodType) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(values: unknown, opts: { file?: File | null; validateExtra?: () => Record<string, string> } = {}) {
    setFormError(null);
    const parsed = schema.safeParse(values);
    const extra = opts.validateExtra?.() ?? {};
    if (!parsed.success || Object.keys(extra).length) {
      const errs = { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...extra };
      setErrors(errs);
      // Move focus to the first invalid control for keyboard and screen-reader users.
      requestAnimationFrame(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
      return;
    }
    setErrors({});
    setPending(true);
    try {
      let body: BodyInit;
      const headers: HeadersInit = {};
      if (opts.file !== undefined) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(values as Record<string, unknown>)) fd.append(k, String(v ?? ""));
        if (opts.file) fd.append("resume", opts.file);
        body = fd;
      } else {
        body = JSON.stringify(values);
        headers["content-type"] = "application/json";
      }
      const res = await fetch("/api/leads", { method: "POST", body, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult({ mode: data.mode, reference: data.reference });
      requestAnimationFrame(() => (document.querySelector('[role="status"]') as HTMLElement | null)?.focus());
    } catch {
      setFormError("You appear to be offline. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const clearError = (field: string) => setErrors((e) => (e[field] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== field)) : e));
  const reset = () => {
    setResult(null);
    setErrors({});
    setFormError(null);
  };

  return { submit, errors, formError, pending, result, clearError, reset };
}

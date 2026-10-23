"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { RESUME_TYPES, careersSchema, validateResume } from "@/lib/leads/schema";
import { ConsentField, FormAlert, Honeypot, SubmitButton, SuccessPanel, TextAreaField, TextField } from "./fields";
import { useLeadSubmit } from "./use-lead-submit";

export function CareersForm({ phone }: { phone: { display: string; href: string } }) {
  const [values, setValues] = useState({ name: "", email: "", mobile: "", brief: "", consent: false, website: "" });
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { submit, errors, formError, pending, result, clearError, reset } = useLeadSubmit(careersSchema);
  const set = (k: keyof typeof values, v: string | boolean) => {
    setValues((s) => ({ ...s, [k]: v }));
    clearError(k);
  };

  if (result) {
    return (
      <SuccessPanel
        title="Application received"
        body={<p>Thank you, {values.name.split(" ")[0]}. We&apos;ll review your resume and contact you if there&apos;s a suitable opening.</p>}
        reference={result.reference}
        mode={result.mode}
        phone={phone}
        onReset={() => {
          reset();
          setFile(null);
        }}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(
          { type: "careers", ...values },
          {
            file,
            validateExtra: () => {
              const problem = validateResume(file);
              return problem ? { resume: problem } : ({} as Record<string, string>);
            },
          },
        );
      }}
      className="relative grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-card md:p-8"
    >
      <Honeypot value={values.website} onChange={(v) => set("website", v)} />
      <TextField label="Full name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Email" type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" value={values.mobile} onChange={(e) => set("mobile", e.target.value)} error={errors.mobile} />
      </div>
      <TextAreaField label="About you" placeholder="Role you're interested in, experience, current location…" value={values.brief} onChange={(e) => set("brief", e.target.value)} error={errors.brief} />

      <div>
        <p className="mb-1.5 text-sm font-medium" id="resume-label">Resume</p>
        <input
          ref={inputRef}
          id="resume"
          type="file"
          accept={Object.keys(RESUME_TYPES).join(",") + ",.doc,.docx,.pdf,.jpg,.jpeg"}
          className="sr-only"
          aria-labelledby="resume-label"
          aria-invalid={errors.resume ? true : undefined}
          aria-describedby="resume-help"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            clearError("resume");
          }}
        />
        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line-strong bg-canvas px-4 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <Paperclip aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="truncate font-medium">{file.name}</span>
              <span className="shrink-0 text-muted">{Math.ceil(file.size / 1024)} KB</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="grid size-8 place-items-center rounded-full hover:bg-sunken"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="resume"
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-7 text-center text-sm transition-colors hover:border-ink/40 hover:bg-canvas ${errors.resume ? "border-accent" : "border-line-strong"}`}
          >
            <Paperclip aria-hidden className="size-5 text-muted" />
            <span className="font-medium">Choose a file</span>
          </label>
        )}
        <p id="resume-help" className={`mt-1.5 text-xs ${errors.resume ? "text-accent-strong" : "text-muted"}`}>
          {errors.resume ?? "JPG, DOC, PDF or DOCX, up to 300 KB."}
        </p>
      </div>

      <ConsentField checked={values.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
      {formError && <FormAlert message={formError} />}
      <div>
        <SubmitButton pending={pending}>Submit application</SubmitButton>
      </div>
    </form>
  );
}

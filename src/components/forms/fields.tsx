"use client";

import { useId, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Info, Loader2, Phone } from "lucide-react";
import Link from "next/link";

const control =
  "w-full rounded-xl border bg-surface px-4 text-[0.95rem] text-ink transition-[border-color,box-shadow] placeholder:text-subtle hover:border-ink/30 focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 aria-[invalid=true]:border-accent aria-[invalid=true]:ring-accent/10";

type FieldProps = { label: string; error?: string; hint?: ReactNode; optional?: boolean; className?: string };

function FieldShell({ id, label, error, hint, optional, className = "", children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-strong">
          <AlertCircle aria-hidden className="size-4 shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({ label, error, hint, optional, className, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-required={!optional || undefined}
        className={`${control} h-12 ${error ? "border-accent" : "border-line-strong"}`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  optional,
  className,
  placeholder,
  options,
  groups,
  ...props
}: FieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    placeholder?: string;
    options?: { value: string; label: string }[];
    groups?: { label: string; options: { value: string; label: string }[] }[];
  }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-required={!optional || undefined}
          className={`${control} h-12 appearance-none pr-10 ${error ? "border-accent" : "border-line-strong"} ${props.value === "" ? "text-subtle" : ""}`}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options?.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
          ))}
          {groups?.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value} className="text-ink">{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, optional, className, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${control} min-h-28 py-3 ${error ? "border-accent" : "border-line-strong"}`}
        {...props}
      />
    </FieldShell>
  );
}

export function ConsentField({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4.5 shrink-0 rounded accent-[var(--color-ink)]"
        />
        <span>
          I agree to be contacted by Shital Motors about this request, and accept the{" "}
          <Link href="/legal/terms" className="font-medium text-ink underline underline-offset-2">terms</Link> and{" "}
          <Link href="/legal/privacy" className="font-medium text-ink underline underline-offset-2">privacy policy</Link>.
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-strong">
          <AlertCircle aria-hidden className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}

/** Hidden from people; bots tend to fill it. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
      </label>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-base font-medium text-white shadow-[0_6px_16px_-6px_rgb(200_16_46/0.6)] transition-colors hover:bg-accent-strong disabled:opacity-70 sm:w-auto"
    >
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending ? "Sending…" : children}
    </button>
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl bg-accent-soft p-4 text-sm text-accent-strong">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function SuccessPanel({
  title,
  body,
  reference,
  mode,
  phone,
  onReset,
}: {
  title: string;
  body: ReactNode;
  reference: string;
  mode: "live" | "demo";
  phone: { display: string; href: string };
  onReset?: () => void;
}) {
  return (
    <div role="status" aria-live="polite" tabIndex={-1} className="animate-rise rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-card outline-none md:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
        <CheckCircle2 aria-hidden className="size-6" />
      </div>
      <h2 className="heading-md mt-5">{title}</h2>
      <div className="mt-2 leading-relaxed text-ink-2">{body}</div>
      <p className="mt-4 text-sm text-muted">
        Reference <span className="tabular font-medium text-ink">{reference}</span>
      </p>
      {mode === "demo" && (
        <div className="mt-5 flex gap-3 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="font-semibold">Demo mode:</strong> this website isn&apos;t connected to the dealership&apos;s systems yet, so your request was not sent. For a quick response, please call us.
          </p>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={phone.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-ink-2">
          <Phone aria-hidden className="size-4" /> Call {phone.display}
        </a>
        {onReset && (
          <button type="button" onClick={onReset} className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-ink ring-1 ring-line-strong hover:ring-ink/40">
            Submit another request
          </button>
        )}
      </div>
    </div>
  );
}

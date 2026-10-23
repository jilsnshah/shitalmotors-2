"use client";

import { useState } from "react";
import { ENQUIRY_TYPES, contactSchema } from "@/lib/leads/schema";
import { groupModels, type FormOptions } from "@/lib/form-options";
import { ConsentField, FormAlert, Honeypot, SelectField, SubmitButton, SuccessPanel, TextAreaField, TextField } from "./fields";
import { useLeadSubmit } from "./use-lead-submit";

export function ContactForm({ options }: { options: FormOptions }) {
  const [values, setValues] = useState({
    enquiryType: ENQUIRY_TYPES[0] as string,
    name: "",
    email: "",
    mobile: "",
    model: "",
    outlet: "",
    message: "",
    consent: false,
    website: "",
  });
  const { submit, errors, formError, pending, result, clearError, reset } = useLeadSubmit(contactSchema);
  const set = (k: keyof typeof values, v: string | boolean) => {
    setValues((s) => ({ ...s, [k]: v }));
    clearError(k);
  };
  const service = values.enquiryType === "Service Booking";
  const outlets = service ? options.workshops : [...options.showrooms, ...options.workshops];

  if (result) {
    return (
      <SuccessPanel
        title="Message received"
        body={<p>Thank you, {values.name.split(" ")[0]}. Our team will get back to you about your {values.enquiryType.toLowerCase()}.</p>}
        reference={result.reference}
        mode={result.mode}
        phone={service ? options.servicePhone : options.salesPhone}
        onReset={reset}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit({ type: "contact", ...values, outlet: values.outlet || undefined, message: values.message || undefined });
      }}
      className="relative grid gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-card md:p-8"
    >
      <Honeypot value={values.website} onChange={(v) => set("website", v)} />
      <fieldset>
        <legend className="mb-3 text-sm font-medium">How can we help?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ENQUIRY_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${values.enquiryType === t ? "border-ink bg-ink text-white" : "border-line-strong text-ink-2 hover:border-ink/40"}`}
            >
              <input type="radio" name="enquiryType" value={t} checked={values.enquiryType === t} onChange={() => set("enquiryType", t)} className="sr-only" />
              {t}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={values.mobile} onChange={(e) => set("mobile", e.target.value)} error={errors.mobile} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Email" optional type="email" autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        <SelectField label="Model" value={values.model} onChange={(e) => set("model", e.target.value)} placeholder="Select a model" groups={[...groupModels(options.models), { label: "Other", options: [{ value: "other", label: "Other / older model" }] }]} error={errors.model} />
      </div>
      <SelectField label={service ? "Workshop" : "Outlet"} optional value={values.outlet} onChange={(e) => set("outlet", e.target.value)} placeholder="No preference" options={outlets.map((o) => ({ value: o.id, label: `${o.label} — ${o.city}${service ? "" : ` (${o.id.startsWith("workshop") ? "workshop" : "showroom"})`}` }))} />
      <TextAreaField label="Message" optional value={values.message} onChange={(e) => set("message", e.target.value)} error={errors.message} maxLength={2000} />
      <ConsentField checked={values.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
      {formError && <FormAlert message={formError} />}
      <div>
        <SubmitButton pending={pending}>Send message</SubmitButton>
      </div>
    </form>
  );
}

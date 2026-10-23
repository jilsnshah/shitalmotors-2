"use client";

import { useState } from "react";
import { SERVICE_SLOTS, SERVICE_TYPES, serviceSchema } from "@/lib/leads/schema";
import type { FormOptions } from "@/lib/form-options";
import { ConsentField, FormAlert, Honeypot, SelectField, SubmitButton, SuccessPanel, TextField } from "./fields";
import { useLeadSubmit } from "./use-lead-submit";
import { useTomorrow } from "./enquiry-form";

export function ServiceForm({ options }: { options: FormOptions }) {
  const [values, setValues] = useState({
    name: "",
    mobile: "",
    registration: "",
    serviceType: "",
    kilometers: "",
    model: "",
    workshop: "",
    date: "",
    slot: "",
    consent: false,
    website: "",
  });
  const { submit, errors, formError, pending, result, clearError, reset } = useLeadSubmit(serviceSchema);
  const tomorrow = useTomorrow();
  const set = (k: keyof typeof values, v: string | boolean) => {
    setValues((s) => ({ ...s, [k]: v }));
    clearError(k);
  };
  const workshop = options.workshops.find((w) => w.id === values.workshop);

  if (result) {
    return (
      <SuccessPanel
        title="Service request received"
        body={
          <p>
            Thank you, {values.name.split(" ")[0]}. Our service advisor will call to confirm your {values.serviceType.toLowerCase()} appointment for{" "}
            <strong className="font-medium text-ink">{values.registration.toUpperCase()}</strong>
            {workshop ? ` at ${workshop.label}` : ""} on {new Date(values.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} ({values.slot}).
          </p>
        }
        reference={result.reference}
        mode={result.mode}
        phone={options.servicePhone}
        onReset={reset}
      />
    );
  }

  // Current models first, then older models owners still bring in.
  const currentNames = new Set(options.models.map((m) => m.label.toLowerCase()));
  const legacy = options.serviceModels.filter((n) => !currentNames.has(n.replace(/^Mahindra\s+/i, "").toLowerCase()));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit({ type: "service", ...values });
      }}
      className="relative grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-card md:p-8"
    >
      <Honeypot value={values.website} onChange={(v) => set("website", v)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={values.mobile} onChange={(e) => set("mobile", e.target.value)} error={errors.mobile} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Registration number" placeholder="e.g. GJ 01 AB 1234" autoCapitalize="characters" value={values.registration} onChange={(e) => set("registration", e.target.value)} error={errors.registration} />
        <SelectField
          label="Model"
          value={values.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="Select your model"
          groups={[
            { label: "Current models", options: options.models.map((m) => ({ value: m.label, label: m.label })) },
            { label: "Earlier models", options: legacy.map((n) => ({ value: n, label: n })) },
          ]}
          error={errors.model}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Service type" value={values.serviceType} onChange={(e) => set("serviceType", e.target.value)} placeholder="Select service type" options={SERVICE_TYPES.map((t) => ({ value: t, label: t }))} error={errors.serviceType} />
        <TextField label="Kilometres driven" optional inputMode="numeric" value={values.kilometers} onChange={(e) => set("kilometers", e.target.value.replace(/\D/g, ""))} error={errors.kilometers} />
      </div>
      <SelectField
        label="Workshop"
        value={values.workshop}
        onChange={(e) => set("workshop", e.target.value)}
        placeholder="Select a workshop"
        options={options.workshops.map((w) => ({ value: w.id, label: `${w.label} — ${w.city}` }))}
        error={errors.workshop}
        hint={workshop?.address}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Preferred date" type="date" min={tomorrow} value={values.date} onChange={(e) => set("date", e.target.value)} error={errors.date} />
        <SelectField label="Preferred time" value={values.slot} onChange={(e) => set("slot", e.target.value)} placeholder="Select a time window" options={SERVICE_SLOTS.map((t) => ({ value: t, label: t }))} error={errors.slot} />
      </div>
      <ConsentField checked={values.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
      {formError && <FormAlert message={formError} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton pending={pending}>Request appointment</SubmitButton>
        <p className="text-sm text-muted">
          Or call <a href={options.servicePhone.href} className="tabular font-medium text-ink hover:text-accent">{options.servicePhone.display}</a>
        </p>
      </div>
    </form>
  );
}

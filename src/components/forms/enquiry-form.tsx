"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { MapPin } from "lucide-react";
import { CITIES, priceSchema, testDriveSchema } from "@/lib/leads/schema";
import { groupModels, type FormOptions } from "@/lib/form-options";
import { ConsentField, FormAlert, Honeypot, SelectField, SubmitButton, SuccessPanel, TextField } from "./fields";
import { useLeadSubmit } from "./use-lead-submit";

/** Test-drive booking and on-road price request share one form; `kind` switches copy and schema. */
export function EnquiryForm({ kind, options }: { kind: "test-drive" | "price"; options: FormOptions }) {
  const params = useSearchParams();
  const initialModel = options.models.some((m) => m.value === params.get("model")) ? params.get("model")! : "";
  const initialVariant = params.get("variant") ?? "";

  const [values, setValues] = useState({
    model: initialModel,
    variant: initialVariant,
    name: "",
    mobile: "",
    city: "" as string,
    outlet: "",
    preferredDate: "",
    consent: false,
    website: "",
  });
  const { submit, errors, formError, pending, result, clearError, reset } = useLeadSubmit(kind === "price" ? priceSchema : testDriveSchema);

  const tomorrow = useTomorrow();
  const model = options.models.find((m) => m.value === values.model);
  const outlets = useMemo(() => options.showrooms.filter((o) => !values.city || o.city === values.city), [options.showrooms, values.city]);
  const outlet = options.showrooms.find((o) => o.id === values.outlet);
  const set = (k: keyof typeof values, v: string | boolean) => {
    setValues((s) => ({ ...s, [k]: v, ...(k === "city" ? { outlet: "" } : {}), ...(k === "model" ? { variant: "" } : {}) }));
    clearError(k);
  };

  if (result) {
    return (
      <SuccessPanel
        title={kind === "price" ? "Price request received" : "Test drive request received"}
        body={
          <p>
            Thank you, {values.name.split(" ")[0]}. {kind === "price" ? "Our sales team will share the on-road price" : "Our team will call to confirm a time"} for the{" "}
            <strong className="font-medium text-ink">{model?.label}</strong>
            {outlet ? ` at our ${outlet.label} showroom` : ""}.
          </p>
        }
        reference={result.reference}
        mode={result.mode}
        phone={options.salesPhone}
        onReset={reset}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit({ type: kind, ...values, variant: kind === "price" ? values.variant || undefined : undefined, preferredDate: values.preferredDate || undefined });
      }}
      className="relative grid gap-8 lg:grid-cols-[1fr_20rem]"
    >
      <div className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-xs md:p-8">
        <Honeypot value={values.website} onChange={(v) => set("website", v)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Model" value={values.model} onChange={(e) => set("model", e.target.value)} placeholder="Select a model" groups={groupModels(options.models)} error={errors.model} />
          {kind === "price" && model && model.variants.length > 1 ? (
            <SelectField label="Variant" optional value={values.variant} onChange={(e) => set("variant", e.target.value)} placeholder="Any / not sure yet" options={model.variants.map((v) => ({ value: v, label: v }))} />
          ) : kind === "test-drive" ? (
            <TextField label="Preferred date" optional type="date" min={tomorrow} value={values.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} hint="We'll confirm availability by phone." />
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full name" autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <TextField label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile" value={values.mobile} onChange={(e) => set("mobile", e.target.value)} error={errors.mobile} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="City" value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Select a city" options={CITIES.map((c) => ({ value: c, label: c }))} error={errors.city} />
          <SelectField
            label="Showroom"
            value={values.outlet}
            onChange={(e) => set("outlet", e.target.value)}
            placeholder={values.city ? "Select a showroom" : "Select a city first"}
            disabled={!values.city}
            options={outlets.map((o) => ({ value: o.id, label: o.label }))}
            error={errors.outlet}
          />
        </div>
        {outlet && (
          <p className="-mt-2 flex items-start gap-2 text-sm text-muted">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" /> {outlet.address}
          </p>
        )}
        <ConsentField checked={values.consent} onChange={(v) => set("consent", v)} error={errors.consent} />
        {formError && <FormAlert message={formError} />}
        <div>
          <SubmitButton pending={pending}>{kind === "price" ? "Request on-road price" : "Request test drive"}</SubmitButton>
        </div>
      </div>

      <aside aria-label="Selected model" className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-xs">
          <div className={`relative aspect-[3/2] ${model?.studio === false ? "bg-sunken" : "stage"}`}>
            {model?.image ? (
              <Image key={model.value} src={model.image} alt={model.label} fill sizes="320px" className="z-[1] animate-fade-in object-cover" />
            ) : (
              <p className="absolute inset-0 z-[3] grid place-items-center px-6 text-center text-sm text-muted">Choose a model to see it here</p>
            )}
          </div>
          <div className="p-5">
            <p className="font-display text-lg font-semibold [font-variation-settings:'wdth'_108]">{model?.label ?? "Your Mahindra"}</p>
            {model?.price && <p className="tabular text-sm text-muted">Ex-showroom from {model.price}</p>}
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              Prefer to talk? Call sales on{" "}
              <a href={options.salesPhone.href} className="tabular font-medium text-ink hover:text-accent">{options.salesPhone.display}</a>
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

const noopSubscribe = () => () => {};
const tomorrowIST = () => new Date(Date.now() + 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** Read from the browser clock only — prerendered HTML never depends on the build-time date. */
export function useTomorrow() {
  return useSyncExternalStore(noopSubscribe, tomorrowIST, () => undefined);
}

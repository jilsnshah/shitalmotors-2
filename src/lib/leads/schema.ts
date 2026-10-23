import { z } from "zod";

/**
 * Lead schemas — shared by the browser (instant validation) and /api/leads
 * (authoritative validation). Rules mirror those enforced by the dealership's
 * current forms: letters-only names, 10-digit Indian mobiles starting 6–9,
 * alphanumeric registration numbers, and resumes up to 300 KB.
 */

const name = z
  .string()
  .trim()
  .min(1, "Please enter your name.")
  .max(100, "Name should contain at most 100 characters.")
  .regex(/^[a-zA-Z\s.'-]+$/, "Name must contain letters only.");

const mobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
  .pipe(z.string().regex(/^\d{10}$/, "Mobile number should be 10 digits.").regex(/^[6-9]/, "Mobile number should start with 6, 7, 8 or 9."));

const email = z.string().trim().email("Please enter a valid email address.");
const optionalEmail = z.union([z.literal(""), email]).optional();
const consent = z.literal(true, { error: "Please agree to be contacted about your request." });
/** Honeypot: real people never see or fill this field. */
const website = z.string().max(0).optional();

export const CITIES = ["Ahmedabad", "Sanand", "Surendranagar"] as const;

export const testDriveSchema = z.object({
  type: z.literal("test-drive"),
  model: z.string().min(1, "Please select a model."),
  name,
  mobile,
  city: z.enum(CITIES, { error: "Please select a city." }),
  outlet: z.string().min(1, "Please select a showroom."),
  preferredDate: z.string().optional(),
  consent,
  website,
});

export const priceSchema = testDriveSchema.extend({
  type: z.literal("price"),
  variant: z.string().optional(),
});

export const SERVICE_TYPES = ["Schedule", "Accidental", "Repair"] as const;
// Windows derived from published workshop hours (09:30 AM – 7 PM).
export const SERVICE_SLOTS = ["9:30 AM – 12:00 PM", "12:00 PM – 3:00 PM", "3:00 PM – 6:30 PM"] as const;

export const serviceSchema = z.object({
  type: z.literal("service"),
  name,
  mobile,
  registration: z
    .string()
    .trim()
    .min(1, "Please enter your registration number.")
    .regex(/^[A-Z0-9\s-]+$/i, "Enter a valid registration number (e.g. GJ 01 AB 1234)."),
  serviceType: z.enum(SERVICE_TYPES, { error: "Please select a service type." }),
  kilometers: z.union([z.literal(""), z.string().regex(/^\d{1,7}$/, "Kilometres should be a number.")]).optional(),
  model: z.string().min(1, "Please select your model."),
  workshop: z.string().min(1, "Please select a workshop."),
  date: z
    .string()
    .min(1, "Please choose a date.")
    .refine((d) => {
      const day = new Date(d + "T00:00:00+05:30");
      const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30");
      return !Number.isNaN(day.getTime()) && day > today;
    }, "Please choose a date from tomorrow onwards."),
  slot: z.enum(SERVICE_SLOTS, { error: "Please choose a time window." }),
  consent,
  website,
});

export const ENQUIRY_TYPES = ["Car Enquiry", "Service Booking", "Complaints / Queries", "Feedback"] as const;

export const contactSchema = z.object({
  type: z.literal("contact"),
  enquiryType: z.enum(ENQUIRY_TYPES),
  name,
  email: optionalEmail,
  mobile,
  model: z.string().min(1, "Please select a model."),
  outlet: z.string().optional(),
  message: z.string().trim().max(2000, "Please keep your message under 2000 characters.").optional(),
  consent,
  website,
});

export const RESUME_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
} as const;
export const RESUME_MAX_BYTES = 300 * 1024;

export const careersSchema = z.object({
  type: z.literal("careers"),
  name,
  email,
  mobile,
  brief: z.string().trim().min(1, "Please tell us briefly about yourself.").max(1500, "Please keep this under 1500 characters."),
  consent,
  website,
});

export const leadSchema = z.discriminatedUnion("type", [testDriveSchema, priceSchema, serviceSchema, contactSchema, careersSchema]);
export type Lead = z.infer<typeof leadSchema>;
export type LeadType = Lead["type"];

/** Flattens zod issues into { field: message } for inline errors. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function validateResume(file: File | null) {
  if (!file || file.size === 0) return "Please attach your resume.";
  if (!(file.type in RESUME_TYPES)) return "Only JPG, DOC, PDF and DOCX files are allowed.";
  if (file.size > RESUME_MAX_BYTES) return "The file must be 300 KB or smaller.";
  return null;
}

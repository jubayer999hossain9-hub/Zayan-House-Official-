import { z } from "zod";

/** Bangladesh mobile number, normalised to 01XXXXXXXXX. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[\s\-()]/g, "");
  return digits.replace(/^\+?88/, "");
}

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^01[3-9]\d{8}$/.test(v), "Enter a valid Bangladeshi mobile number (e.g. 01712345678)");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(100),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Only allow redirects to paths inside this site. */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

/* ---------- Cart / checkout ---------- */
import { DISTRICTS } from "./districts";
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from "./pricing-utils";

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      variantId: z.number().int().positive().nullable(),
      qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
    }),
  )
  .max(MAX_CART_LINES);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

export const checkoutSchema = z.object({
  items: cartItemsSchema.min(1, "Your cart is empty."),
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null)
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email address"),
  address: z.string().trim().min(5, "Enter your full address").max(300),
  area: optionalText(100),
  city: z.string().trim().min(2, "Enter your city or upazila").max(100),
  district: z.enum(DISTRICTS, { message: "Choose your district" }),
  postalCode: optionalText(10).refine((v) => v === null || /^\d{4}$/.test(v), "Postal code must be 4 digits"),
  notes: optionalText(500),
  couponCode: optionalText(40),
  saveAddress: z.boolean().default(false),
});

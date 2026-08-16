import { z } from "zod";

export const moneySchema = z.coerce
  .number()
  .finite()
  .nonnegative()
  .multipleOf(0.01);

export const positiveMoneySchema = z.coerce
  .number()
  .finite()
  .min(1, "Amount must be at least 1");

export const requiredStringSchema = z.string().trim().min(1, "This field is required");

export const optionalStringSchema = z.preprocess(
  (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : typeof val === "string" ? val.trim() : val),
  z.string().optional()
);

export const optionalDateSchema = z.preprocess(
  (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : typeof val === "string" ? val.trim() : val),
  z.string().optional()
);

export const optionalEmailSchema = z.preprocess(
  (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
  z.string().trim().email("Invalid email address").optional()
);



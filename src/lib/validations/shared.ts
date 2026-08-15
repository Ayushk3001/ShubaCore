import { z } from "zod";

export const moneySchema = z.coerce
  .number()
  .finite()
  .nonnegative()
  .multipleOf(0.01);

export const requiredStringSchema = z.string().trim().min(1);


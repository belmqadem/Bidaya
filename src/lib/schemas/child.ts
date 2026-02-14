import { z } from "zod";

export const registerChildSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  birthDate: z
    .string()
    .min(1, "Birth date is required")
    .refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  parentName: z
    .string()
    .min(2, "Parent name must be at least 2 characters")
    .max(120, "Parent name is too long"),
  parentContact: z
    .string()
    .min(5, "Contact must be at least 5 characters")
    .max(120, "Contact is too long"),
});

export type RegisterChildInput = z.infer<typeof registerChildSchema>;

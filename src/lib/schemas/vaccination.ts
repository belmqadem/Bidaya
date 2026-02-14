import { z } from "zod";

export const addVaccinationSchema = z.object({
  childIdentifier: z.string().min(1, "Child identifier is required"),
  vaccine: z.string().min(1, "Vaccine name is required").max(120),
  dose: z.coerce.number().int().min(1, "Dose must be at least 1").max(10),
  date: z.string().min(1, "Date is required").refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  clinicName: z.string().min(1, "Clinic name is required").max(120),
});

export type AddVaccinationInput = z.infer<typeof addVaccinationSchema>;

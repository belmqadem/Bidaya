import { z } from "zod";

export const addConsultationSchema = z.object({
  childIdentifier: z.string().min(1, "Child identifier is required"),
  date: z.string().min(1, "Date is required").refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  summary: z.string().min(2, "Summary must be at least 2 characters").max(2000),
  clinicianName: z.string().min(2, "Clinician name is required").max(120),
});

export type AddConsultationInput = z.infer<typeof addConsultationSchema>;

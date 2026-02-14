import { z } from "zod";

export const addConsultationSchema = z.object({
  childIdentifier: z.string().min(1, "L'identifiant enfant est requis"),
  date: z.string().min(1, "La date est requise").refine((v) => !isNaN(Date.parse(v)), "Date invalide"),
  summary: z.string().min(2, "Le résumé doit contenir au moins 2 caractères").max(2000),
  clinicianName: z.string().min(2, "Le nom du clinicien est requis").max(120),
  reasonForVisit: z.string().max(500).optional(),
  diagnosis: z.string().max(500).optional(),
  followUpRequired: z.boolean().default(false),
  treatmentPrescribed: z.string().max(1000).optional(),
  followUpDate: z.string().optional().refine((v) => !v || !isNaN(Date.parse(v)), "Date invalide"),
});

export type AddConsultationInput = z.infer<typeof addConsultationSchema>;

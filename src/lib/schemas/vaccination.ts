import { z } from "zod";

export const addVaccinationSchema = z.object({
  childIdentifier: z.string().min(1, "L'identifiant enfant est requis"),
  vaccine: z.string().min(1, "Le nom du vaccin est requis").max(120),
  dose: z.coerce.number().int().min(1, "La dose doit être au moins 1").max(10),
  date: z.string().min(1, "La date est requise").refine((v) => !isNaN(Date.parse(v)), "Date invalide"),
  clinicName: z.string().min(1, "Le nom de la clinique est requis").max(120),
  nextDoseDate: z.string().optional().refine((v) => !v || !isNaN(Date.parse(v)), "Date invalide"),
  healthcareProfessionalName: z.string().max(120).optional(),
});

export type AddVaccinationInput = z.infer<typeof addVaccinationSchema>;

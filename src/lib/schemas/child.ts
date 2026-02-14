import { z } from "zod";

export const registerChildSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères")
    .max(120, "Le nom complet est trop long"),
  birthDate: z
    .string()
    .min(1, "La date de naissance est requise")
    .refine((v) => !isNaN(Date.parse(v)), "Date invalide"),
  gender: z.enum(["male", "female", "unknown"]).default("unknown"),
  birthWeight: z.coerce.number().min(0.1).max(10).optional(),
  deliveryType: z.enum(["normal", "cesarean"]).default("normal"),
  parentName: z
    .string()
    .min(2, "Le nom du parent doit contenir au moins 2 caractères")
    .max(120, "Le nom du parent est trop long"),
  parentContact: z
    .string()
    .min(5, "Le contact doit contenir au moins 5 caractères")
    .max(120, "Le contact est trop long"),
});

export type RegisterChildInput = z.infer<typeof registerChildSchema>;

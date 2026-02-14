import { z } from "zod";

export const registerChildSchema = z.object({
  // ── Child info ──
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
  deliveryType: z.enum(["voie basse", "cesarean"]).default("voie basse"),

  // ── Parent info ──
  parentName: z
    .string()
    .min(2, "Le nom du parent doit contenir au moins 2 caractères")
    .max(120, "Le nom du parent est trop long"),
  parentContact: z
    .string()
    .min(5, "Le contact doit contenir au moins 5 caractères")
    .max(120, "Le contact est trop long"),

  // ── Maternal data (for AI risk analysis, metric system) ──
  gestationWeeks: z.coerce.number().min(20, "Min. 20 semaines").max(45, "Max. 45 semaines").optional(),
  parity: z.coerce.number().min(0).max(1).optional(),
  maternalAge: z.coerce.number().min(14, "Min. 14 ans").max(55, "Max. 55 ans").optional(),
  maternalHeight: z.coerce.number().min(120, "Min. 120 cm").max(200, "Max. 200 cm").optional(),
  maternalWeight: z.coerce.number().min(35, "Min. 35 kg").max(150, "Max. 150 kg").optional(),
  smokingStatus: z.boolean().default(false),
});

export type RegisterChildInput = z.infer<typeof registerChildSchema>;

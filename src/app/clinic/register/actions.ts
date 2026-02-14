"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { generateChildId } from "@/lib/id-generator";
import { registerChildSchema, type RegisterChildInput } from "@/lib/schemas/child";

type ActionResult =
  | { success: true; identifier: string }
  | { success: false; error: string };

export async function registerChild(input: RegisterChildInput): Promise<ActionResult> {
  await requireRole("clinic");

  const parsed = registerChildSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return { success: false, error: msg };
  }

  const { fullName, birthDate, gender, birthWeight, birthLength, headCircumferenceAtBirth, placeOfBirth, deliveryType, parentName, parentContact } = parsed.data;

  let identifier = generateChildId();
  let retries = 5;
  while (retries > 0) {
    const exists = await prisma.child.findUnique({ where: { identifier } });
    if (!exists) break;
    identifier = generateChildId();
    retries--;
  }
  if (retries === 0) {
    return { success: false, error: "Échec de génération de l'identifiant unique. Veuillez réessayer." };
  }

  try {
    await prisma.child.create({
      data: {
        identifier,
        fullName,
        birthDate: new Date(birthDate),
        gender: gender ?? "unknown",
        birthWeight: birthWeight ?? null,
        birthLength: birthLength ?? null,
        headCircumferenceAtBirth: headCircumferenceAtBirth ?? null,
        placeOfBirth: placeOfBirth || null,
        deliveryType: deliveryType ?? "normal",
        parentName,
        parentContact,
      },
    });
  } catch {
    return { success: false, error: "Échec de l'enregistrement. Veuillez réessayer." };
  }

  return { success: true, identifier };
}

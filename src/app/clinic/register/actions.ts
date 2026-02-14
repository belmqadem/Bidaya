"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { generateChildId } from "@/lib/id-generator";
import { registerChildSchema, type RegisterChildInput } from "@/lib/schemas/child";

type ActionResult =
  | { success: true; identifier: string }
  | { success: false; error: string };

export async function registerChild(input: RegisterChildInput): Promise<ActionResult> {
  // Auth guard — clinic only
  await requireRole("clinic");

  // Validate
  const parsed = registerChildSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join(", ");
    return { success: false, error: msg };
  }

  const { fullName, birthDate, parentName, parentContact } = parsed.data;

  // Generate unique identifier (retry on collision)
  let identifier = generateChildId();
  let retries = 5;
  while (retries > 0) {
    const exists = await prisma.child.findUnique({ where: { identifier } });
    if (!exists) break;
    identifier = generateChildId();
    retries--;
  }
  if (retries === 0) {
    return { success: false, error: "Failed to generate unique identifier. Please try again." };
  }

  try {
    await prisma.child.create({
      data: {
        identifier,
        fullName,
        birthDate: new Date(birthDate),
        parentName,
        parentContact,
      },
    });
  } catch {
    return { success: false, error: "Failed to save record. Please try again." };
  }

  return { success: true, identifier };
}

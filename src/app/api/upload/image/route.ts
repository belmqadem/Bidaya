import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

// ── Config ───────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// ── Rate limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Auth: parent only
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json(
      { error: "Non autorisé." },
      { status: 403 },
    );
  }

  // 2. Rate limit
  if (!checkRateLimit(session.email)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter." },
      { status: 429 },
    );
  }

  // 3. Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Aucune image fournie." },
      { status: 400 },
    );
  }

  // 4. Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPG, PNG ou WebP." },
      { status: 400 },
    );
  }

  // 5. Validate size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "L'image dépasse 5 Mo." },
      { status: 400 },
    );
  }

  // 6. Generate unique filename
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uniqueId = randomBytes(16).toString("hex");
  const filename = `${uniqueId}.${ext}`;

  // 7. Write file to disk
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, filename), buffer);
  } catch (e) {
    console.error("Upload write error:", e);
    return NextResponse.json(
      { error: "Échec de l'enregistrement de l'image." },
      { status: 500 },
    );
  }

  // 8. Return public URL path
  return NextResponse.json({ url: `/uploads/${filename}` });
}

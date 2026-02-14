"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoiceDescriptionButton } from "@/features/voice/VoiceDescriptionButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createReport,
  getMyVaccinations,
  type VaccinationOption,
} from "../../report-actions";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function NewReportPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vaccinations, setVaccinations] = useState<VaccinationOption[]>([]);
  const [vaccinationId, setVaccinationId] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("mild");
  const [error, setError] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyVaccinations().then(setVaccinations);
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez JPG, PNG ou WebP.");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError("L'image dépasse 5 Mo.");
      return;
    }

    setError("");
    setImageFile(file);

    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Échec de l'envoi de l'image.");
      }

      return data.url as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l'envoi de l'image.";
      setError(msg);
      return null;
    } finally {
      setImageUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      // Upload image first if present
      let imageUrl: string | undefined;
      if (imageFile) {
        const url = await uploadImage();
        if (url) {
          imageUrl = url;
        } else {
          return; // upload failed, error is already set
        }
      }

      const result = await createReport({
        vaccinationId: vaccinationId || undefined,
        description,
        severity,
        imageUrl,
      });

      if (result.success && result.reportId) {
        router.push(`/parent/report/${result.reportId}`);
      } else {
        setError(result.success ? "" : result.error);
      }
    });
  }

  return (
    <Card className="border-t-4 border-t-amber-500">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <Link href="/parent">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Signaler un effet indésirable
            </CardTitle>
            <CardDescription className="mt-1">
              Décrivez les symptômes observés après la vaccination. Le médecin
              sera notifié et pourra vous répondre.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-0">
          {vaccinations.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Vaccination concernée
            </label>
              <Select onValueChange={setVaccinationId} value={vaccinationId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une vaccination (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {vaccinations.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sévérité des symptômes
            </label>
            <Select onValueChange={setSeverity} value={severity}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Léger</SelectItem>
                <SelectItem value="moderate">Modéré</SelectItem>
                <SelectItem value="severe">Sévère</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Description des symptômes *
              </label>
              <VoiceDescriptionButton
                onTranscript={(text) => {
                  setDescription((prev) => prev ? `${prev}\n${text}` : text);
                }}
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les symptômes observés : fièvre, rougeur, gonflement, pleurs inhabituels…"
              rows={5}
              required
            />
          </div>

          {/* ── Photo attachment ──────────────────────────────────────── */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Photo (optionnel)
            </label>
            <p className="text-xs text-muted-foreground">
              Ajoutez une photo pour illustrer les symptômes (JPG, PNG ou WebP, max 5 Mo).
            </p>

            {!imagePreview ? (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-6 transition-colors hover:border-amber-400/50 hover:bg-amber-50/30">
                <Camera className="size-6 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">
                  Appuyez pour ajouter une photo
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Aperçu de la photo"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X className="size-4" />
                </button>
                {imageFile && (
                  <div className="bg-muted/80 px-3 py-1.5 text-xs text-muted-foreground">
                    {imageFile.name} · {(imageFile.size / 1024).toFixed(0)} Ko
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
            disabled={isPending || imageUploading || !description.trim()}
          >
            {imageUploading ? (
              <><Loader2 className="mr-2 size-4 animate-spin" /> Envoi de l&apos;image…</>
            ) : isPending ? (
              "Envoi en cours…"
            ) : (
              "Envoyer le signalement"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

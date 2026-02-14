"use client";

import { useEffect, useState, useTransition } from "react";
import {
  User,
  Calendar,
  Phone,
  Clock,
  Syringe,
  ClipboardList,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMyChild,
  type ChildProfile,
  type VaccinationEntry,
  type ConsultationEntry,
} from "./actions";

// ── Main component ───────────────────────────────────────────────────────────

export function ChildDashboard() {
  const [isPending, startTransition] = useTransition();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [vaccinations, setVaccinations] = useState<VaccinationEntry[]>([]);
  const [consultations, setConsultations] = useState<ConsultationEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getMyChild();
      if (result.found) {
        setChild(result.child);
        setVaccinations(result.vaccinations);
        setConsultations(result.consultations);
      } else {
        setError(result.error);
      }
    });
  }, []);

  if (isPending && !child) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-muted-foreground text-center text-sm">{error}</p>
    );
  }

  if (!child) return null;

  return (
    <div className="space-y-4">
      <ChildProfileCard child={child} />
      <VaccinationTimeline vaccinations={vaccinations} />
      <ConsultationHistory consultations={consultations} />
    </div>
  );
}

// ── Child profile card ───────────────────────────────────────────────────────

function ChildProfileCard({ child }: { child: ChildProfile }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(child.identifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-l-4 border-l-healthcare">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{child.fullName}</CardTitle>
          <button
            type="button"
            onClick={copyId}
            className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium tracking-wider transition-colors hover:bg-muted/80"
          >
            {child.identifier}
            {copied ? (
              <Check className="size-3 text-green-600" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </div>
        <CardDescription>Child health record</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow icon={Calendar} label="Birth date" value={child.birthDate} />
          <InfoRow icon={User} label="Parent" value={child.parentName} />
          <InfoRow icon={Phone} label="Contact" value={child.parentContact} />
          <InfoRow icon={Clock} label="Registered" value={child.createdAt} />
        </dl>
      </CardContent>
    </Card>
  );
}

// ── Vaccination timeline ─────────────────────────────────────────────────────

function VaccinationTimeline({
  vaccinations,
}: {
  vaccinations: VaccinationEntry[];
}) {
  if (vaccinations.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center text-sm">
            No vaccinations recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Syringe className="size-4" />
          Vaccination timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div
            className="absolute bottom-0 left-[1.4rem] top-0 w-px bg-border"
            aria-hidden
          />
          {vaccinations.map((v, i) => (
            <div key={v.id} className="relative flex gap-4 pb-4 pl-4 last:pb-0">
              {/* Dot */}
              <div
                className={`absolute -left-[0.15rem] top-1 size-2.5 rounded-full border-2 border-background ${
                  i === 0 ? "bg-healthcare" : "bg-muted-foreground/40"
                }`}
                aria-hidden
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{v.vaccine}</p>
                  <span className="text-muted-foreground text-xs">{v.date}</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Dose {v.dose} &middot; {v.clinicName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Consultation history ─────────────────────────────────────────────────────

function ConsultationHistory({
  consultations,
}: {
  consultations: ConsultationEntry[];
}) {
  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center text-sm">
            No consultations recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4" />
          Consultation history
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {consultations.map((c) => (
            <div key={c.id} className="px-6 py-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">{c.clinicianName}</p>
                <span className="text-muted-foreground text-xs">{c.date}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {c.summary}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div>
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

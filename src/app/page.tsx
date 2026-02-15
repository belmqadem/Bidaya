import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Baby,
  MessageCircle,
  FileText,
  Pill,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Brain,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/Logo.png" alt="Bidaya" width={32} height={32} className="size-8 rounded-lg object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/select-role"
              className="rounded-full bg-healthcare px-5 py-2 text-sm font-medium text-healthcare-foreground transition-colors hover:bg-healthcare/90"
            >
              Accéder à la plateforme
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-healthcare/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="size-3.5 text-healthcare" />
              Carnet de santé numérique vérifié
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Le carnet de santé{" "}
              <span className="text-healthcare">numérique</span> de votre enfant
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Bidaya numérise le carnet de santé de l&apos;enfant et connecte
              parents, cliniques et pharmacies pour un suivi médical sécurisé et
              accessible.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/select-role"
                className="inline-flex items-center gap-2 rounded-full bg-healthcare px-7 py-3 text-sm font-semibold text-healthcare-foreground shadow-md transition-all hover:bg-healthcare/90 hover:shadow-lg"
              >
                Commencer
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Découvrir le fonctionnement
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problème ─────────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Le problème
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Au Maroc, le suivi médical des enfants repose sur des carnets
              papier. Ils se perdent, s&apos;abîment et ne sont pas accessibles
              à distance. En cas d&apos;effets secondaires après une vaccination,
              le parent doit se déplacer physiquement. Les ordonnances papier
              sont facilement falsifiables ou réutilisables.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Baby,
                title: "Carnets perdus",
                text: "Les documents papier se dégradent et ne sont pas accessibles quand on en a besoin.",
              },
              {
                icon: MessageCircle,
                title: "Communication difficile",
                text: "Aucun moyen simple pour les parents de contacter le médecin après une vaccination.",
              },
              {
                icon: FileText,
                title: "Ordonnances non sécurisées",
                text: "Les ordonnances papier peuvent être réutilisées frauduleusement dans plusieurs pharmacies.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl border bg-background p-5"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-red-50">
                  <Icon className="size-5 text-red-500" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="border-t py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Comment ça marche
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Un circuit numérique sécurisé entre trois acteurs.
            </p>
          </div>
          <div className="mt-14 space-y-16">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-healthcare/10">
                <Stethoscope className="size-7 text-healthcare" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-healthcare">
                  Étape 1
                </div>
                <h3 className="text-lg font-bold">
                  La clinique crée le dossier
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  À la naissance, le personnel clinique enregistre le
                  nouveau-né : informations de l&apos;enfant, poids, taille,
                  informations du parent. Un{" "}
                  <strong>identifiant unique</strong> est généré et remis au
                  parent.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-8 md:flex-row-reverse">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <Baby className="size-7 text-blue-600" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Étape 2
                </div>
                <h3 className="text-lg font-bold">
                  Le parent accède au carnet
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Le parent se connecte avec l&apos;identifiant unique et son
                  numéro de téléphone. Il consulte le profil, le calendrier
                  vaccinal, l&apos;historique complet et peut signaler des effets
                  indésirables après une vaccination.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                <MessageCircle className="size-7 text-amber-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Étape 3
                </div>
                <h3 className="text-lg font-bold">
                  Communication post-vaccination
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  En cas d&apos;effets secondaires, le parent signale les
                  symptômes. Le médecin répond, échange avec le parent et peut
                  émettre une <strong>ordonnance numérique</strong> avec un code
                  unique.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-8 md:flex-row-reverse">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                <Pill className="size-7 text-emerald-600" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Étape 4
                </div>
                <h3 className="text-lg font-bold">
                  La pharmacie dispense en toute sécurité
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Le parent communique le code d&apos;ordonnance à la pharmacie.
                  Celle-ci vérifie l&apos;ordonnance, dispense les médicaments
                  et la marque comme utilisée.{" "}
                  <strong>Aucune réutilisation possible.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 espaces ────────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Trois espaces dédiés
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Chaque acteur accède aux fonctionnalités adaptées à son rôle.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border bg-background">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/patient-side.png"
                  alt="Espace Parent"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    Espace Parent
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {[
                    "Carnet de santé complet",
                    "Calendrier vaccinal",
                    "Signalement d'effets",
                    "Ordonnances numériques",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-healthcare" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-background">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/staff-side.png"
                  alt="Espace Clinique"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    Espace Clinique
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {[
                    "Création de dossiers",
                    "Vaccinations & consultations",
                    "Réponse aux signalements",
                    "Émission d'ordonnances",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-healthcare" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border bg-background">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src="/pharmacy.jpg"
                  alt="Espace Pharmacie"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    Espace Pharmacie
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {[
                    "Vérification par code",
                    "Détails de l'ordonnance",
                    "Dispensation sécurisée",
                    "Anti-fraude intégré",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IA ───────────────────────────────────────────────────────────── */}
      <section className="border-t py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
              <Brain className="size-8 text-purple-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Intelligence artificielle intégrée
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Un outil d&apos;IA permet au personnel clinique d&apos;estimer
                le risque néonatal à partir des données maternelles (gestation,
                parité, âge, poids, taille, tabagisme). Le modèle prédit le
                poids de naissance et classe le risque en trois niveaux :{" "}
                <strong>faible</strong>, <strong>modéré</strong> ou{" "}
                <strong>élevé</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t bg-linear-to-b from-healthcare/5 to-transparent py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Prêt à commencer ?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Accédez à la plateforme en tant que parent, clinique ou pharmacie.
          </p>
          <div className="mt-8">
            <Link
              href="/select-role"
              className="inline-flex items-center gap-2 rounded-full bg-healthcare px-8 py-3.5 text-sm font-semibold text-healthcare-foreground shadow-md transition-all hover:bg-healthcare/90 hover:shadow-lg"
            >
              Accéder à Bidaya
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="Bidaya" width={24} height={24} className="size-6 rounded-md object-contain" />
              <span className="text-sm font-semibold">Bidaya</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Carnet de santé numérique de l&apos;enfant — Vérifié par la
              clinique
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

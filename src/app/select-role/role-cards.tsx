"use client";

import Image from "next/image";
import Link from "next/link";

const roles = [
  {
    role: "parent" as const,
    label: "Espace Parent",
    description: "Accédez au carnet de santé numérique de votre enfant grâce à son identifiant unique",
    image: "/patient-side.png",
    overlay: "bg-black/45",
    href: "/login/parent",
  },
  {
    role: "clinic" as const,
    label: "Espace Clinique",
    description: "Enregistrez les vaccinations, consultations et créez de nouveaux dossiers vérifiés",
    image: "/staff-side.png",
    overlay: "bg-black/55",
    href: "/login?role=clinic",
  },
  {
    role: "pharmacy" as const,
    label: "Espace Pharmacie",
    description: "Vérifiez et dispensez les ordonnances numériques émises par les cliniques",
    image: "/pharmacy.jpg",
    overlay: "bg-black/60",
    href: "/login?role=pharmacy",
  },
];

export function RoleCards() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-3">
      {roles.map(({ role, label, description, image, overlay, href }) => (
        <Link
          key={role}
          href={href}
          className="group relative flex min-h-[33vh] flex-1 cursor-pointer overflow-hidden md:min-h-screen"
        >
          {/* Contenu texte */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-8 text-center md:gap-4 md:p-10">
            <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-xl transition-transform duration-300 ease-out group-hover:-translate-y-1 md:text-4xl lg:text-5xl">
              {label}
            </span>
            <span className="max-w-xs text-sm leading-relaxed text-white/85 drop-shadow-lg md:max-w-sm md:text-base">
              {description}
            </span>
            <span className="mt-4 inline-block rounded-full border-2 border-white/50 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 group-hover:border-white group-hover:bg-white/15 group-hover:text-white md:px-8 md:py-3 md:text-base">
              Accéder &rarr;
            </span>
          </div>

          {/* Image + overlay */}
          <div className="absolute inset-0 transition-all duration-500 ease-out group-hover:scale-105">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className={`absolute inset-0 ${overlay} transition-colors duration-300 group-hover:bg-black/30`} aria-hidden />
          </div>
        </Link>
      ))}
    </div>
  );
}

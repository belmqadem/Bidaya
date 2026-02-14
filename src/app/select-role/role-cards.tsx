"use client";

import Image from "next/image";
import Link from "next/link";

const roles = [
  {
    role: "parent" as const,
    label: "Parent",
    description: "Consultez le carnet de vaccination et l'historique des consultations de votre enfant",
    image: "/patient-side.png",
    overlay: "bg-black/45",
    href: "/login/parent",
  },
  {
    role: "clinic" as const,
    label: "Personnel Médical",
    description: "Recherchez des dossiers, enregistrez les vaccinations et gérez les données de santé",
    image: "/staff-side.png",
    overlay: "bg-black/55",
    href: "/login?role=clinic",
  },
];

export function RoleCards() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      {roles.map(({ role, label, description, image, overlay, href }) => (
        <Link
          key={role}
          href={href}
          className="group relative flex min-h-[50vh] flex-1 cursor-pointer overflow-hidden md:min-h-screen"
        >
          {/* Contenu texte */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-10 text-center">
            <span className="text-5xl font-extrabold tracking-tight text-white drop-shadow-xl transition-transform duration-300 ease-out group-hover:-translate-y-1 md:text-6xl lg:text-7xl">
              {label}
            </span>
            <span className="max-w-md text-lg leading-relaxed text-white/85 drop-shadow-lg md:text-xl">
              {description}
            </span>
            <span className="mt-6 inline-block rounded-full border-2 border-white/50 px-8 py-3 text-base font-semibold text-white transition-all duration-300 group-hover:border-white group-hover:bg-white/15 group-hover:text-white md:text-lg">
              Continuer &rarr;
            </span>
          </div>

          {/* Image + overlay */}
          <div className="absolute inset-0 transition-all duration-500 ease-out group-hover:scale-105">
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className={`absolute inset-0 ${overlay} transition-colors duration-300 group-hover:bg-black/30`} aria-hidden />
          </div>
        </Link>
      ))}
    </div>
  );
}

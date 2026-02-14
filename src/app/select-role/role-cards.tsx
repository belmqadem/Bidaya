"use client";

import Image from "next/image";
import Link from "next/link";

const roles = [
  {
    role: "parent" as const,
    label: "Parent",
    description: "View my child's vaccination record",
    image: "/patient-side.png",
    overlay: "bg-black/40",
    href: "/login/parent",
  },
  {
    role: "clinic" as const,
    label: "Clinic staff",
    description: "Search children and record vaccinations",
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="text-3xl font-bold text-white drop-shadow-lg transition-transform duration-300 ease-out group-hover:-translate-y-1">
              {label}
            </span>
            <span className="max-w-xs text-sm text-white/80 drop-shadow-md transition-opacity duration-300 group-hover:text-white">
              {description}
            </span>
            <span className="mt-4 inline-block rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-white/90 transition-all duration-300 group-hover:border-white group-hover:bg-white/10 group-hover:text-white">
              Continue
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

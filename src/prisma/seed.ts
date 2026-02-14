/**
 * Seed script — populates the database with realistic Moroccan mock data.
 *
 * Usage:  npx tsx src/prisma/seed.ts
 *         — or —  npm run db:seed
 */

import { prisma } from "../lib/prisma";

// ── Helpers ──────────────────────────────────────────────────────────────────

function date(iso: string) {
  return new Date(iso);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database…\n");

  // ── Clean existing data (order matters for FK constraints) ──────────────
  await prisma.reportMessage.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.sideEffectReport.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.child.deleteMany();

  console.log("   ✓ Cleaned existing data");

  // ══════════════════════════════════════════════════════════════════════════
  //  CHILD 1 — Yassine Bennani
  // ══════════════════════════════════════════════════════════════════════════

  const yassine = await prisma.child.create({
    data: {
      identifier: "CHR-YB7K-3NHP",
      fullName: "Yassine Bennani",
      birthDate: date("2025-09-15"),
      gender: "male",
      birthWeight: 3.45,
      birthLength: 50,
      headCircumferenceAtBirth: 34.5,
      placeOfBirth: "Clinique Al Hayat, Casablanca",
      deliveryType: "voie basse",
      parentName: "Fatima Zahra Bennani",
      parentContact: "0661234567",
    },
  });

  // Vaccinations — naissance
  const vaccBCG = await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "BCG",
      dose: 1,
      date: date("2025-09-15"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
      batchNumber: "BCG-2025-0412",
      injectionSite: "Épaule gauche",
      notes: "Bonne tolérance",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "VHB",
      dose: 1,
      date: date("2025-09-15"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
      batchNumber: "VHB-2025-1187",
      injectionSite: "Cuisse droite",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "VPO",
      dose: 0,
      date: date("2025-09-15"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
      notes: "Dose orale",
    },
  });

  // Vaccinations — 2 mois
  const vaccDTC1 = await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "DTC",
      dose: 1,
      date: date("2025-11-17"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
      batchNumber: "DTC-2025-3321",
      injectionSite: "Cuisse gauche",
      nextDoseDate: date("2026-01-17"),
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "VPO",
      dose: 1,
      date: date("2025-11-17"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: yassine.id,
      vaccine: "Pneumo",
      dose: 1,
      date: date("2025-11-17"),
      clinicName: "Clinique Al Hayat",
      healthcareProfessionalName: "Dr. Amina Tazi",
      batchNumber: "PNE-2025-0098",
      injectionSite: "Cuisse droite",
    },
  });

  // Consultation — visite de contrôle 1 mois
  await prisma.consultation.create({
    data: {
      childId: yassine.id,
      date: date("2025-10-15"),
      summary:
        "Visite de contrôle à 1 mois. Croissance normale, poids 4.2 kg, taille 53 cm. Réflexes normaux.",
      clinicianName: "Dr. Amina Tazi",
      reasonForVisit: "Contrôle du premier mois",
      diagnosis: "Développement normal",
      followUpRequired: false,
    },
  });

  // Consultation — visite de contrôle 2 mois
  await prisma.consultation.create({
    data: {
      childId: yassine.id,
      date: date("2025-11-17"),
      summary:
        "Visite de contrôle à 2 mois. Poids 5.1 kg, taille 57 cm. Vaccinations administrées. Léger érythème au site d'injection DTC, rassurant.",
      clinicianName: "Dr. Amina Tazi",
      reasonForVisit: "Contrôle des 2 mois + vaccination",
      diagnosis: "Développement normal, réaction locale bénigne au DTC",
      followUpRequired: true,
      followUpDate: date("2026-01-17"),
      treatmentPrescribed: "Paracétamol en cas de fièvre > 38°C",
    },
  });

  // Side-effect report — fièvre post-DTC (with thread + prescription)
  const reportYassine = await prisma.sideEffectReport.create({
    data: {
      childId: yassine.id,
      vaccinationId: vaccDTC1.id,
      description:
        "Fièvre à 38.5°C apparue 6 heures après la vaccination DTC. L'enfant est irritable et pleure plus que d'habitude. Légère rougeur au site d'injection sur la cuisse gauche.",
      severity: "moderate",
      status: "prescribed",
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportYassine.id,
      senderRole: "parent",
      content:
        "Bonjour docteur, Yassine a de la fièvre depuis cet après-midi (38.5°C). Il pleure beaucoup et la cuisse est un peu rouge là où il a eu la piqûre.",
      createdAt: daysAgo(5),
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportYassine.id,
      senderRole: "clinic",
      content:
        "Bonjour Mme Bennani, ne vous inquiétez pas, c'est une réaction normale après le DTC. Donnez-lui du paracétamol adapté à son poids (dose de 60 mg). Si la fièvre dépasse 39°C ou persiste plus de 48h, consultez en urgence. Je vous prépare une ordonnance.",
      createdAt: daysAgo(5),
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportYassine.id,
      senderRole: "parent",
      content: "Merci beaucoup docteur, je vais donner le paracétamol. La fièvre est à 38.3 maintenant.",
      createdAt: daysAgo(4),
    },
  });

  await prisma.prescription.create({
    data: {
      code: "ORD-FZ7K-9BHP",
      reportId: reportYassine.id,
      childId: yassine.id,
      doctorName: "Amina Tazi",
      medications:
        "Doliprane pédiatrique (paracétamol) — Suspension buvable 2.4%\nDose : 60 mg (1 pipette de 2.5 kg) toutes les 6 heures si fièvre > 38°C",
      instructions:
        "Maximum 4 prises par 24 heures.\nNe pas dépasser 60 mg/kg/jour.\nSi la fièvre persiste au-delà de 48h ou dépasse 39°C, consulter en urgence.",
      notes: "Réaction post-vaccinale au DTC. Surveillance parentale.",
      status: "active",
    },
  });

  console.log("   ✓ Yassine Bennani — 6 vaccinations, 2 consultations, 1 signalement + ordonnance");

  // ══════════════════════════════════════════════════════════════════════════
  //  CHILD 2 — Khadija El Amrani
  // ══════════════════════════════════════════════════════════════════════════

  const khadija = await prisma.child.create({
    data: {
      identifier: "CHR-KE4M-8WRT",
      fullName: "Khadija El Amrani",
      birthDate: date("2025-06-02"),
      gender: "female",
      birthWeight: 3.1,
      birthLength: 48,
      headCircumferenceAtBirth: 33,
      placeOfBirth: "Hôpital Mohammed V, Rabat",
      deliveryType: "cesarean",
      parentName: "Nadia El Amrani",
      parentContact: "0677891234",
    },
  });

  // Naissance
  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "BCG",
      dose: 1,
      date: date("2025-06-02"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      batchNumber: "BCG-2025-0198",
      injectionSite: "Épaule gauche",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "VHB",
      dose: 1,
      date: date("2025-06-02"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      batchNumber: "VHB-2025-0876",
      injectionSite: "Cuisse droite",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "VPO",
      dose: 0,
      date: date("2025-06-02"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
    },
  });

  // 2 mois
  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "DTC",
      dose: 1,
      date: date("2025-08-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      batchNumber: "DTC-2025-2904",
      injectionSite: "Cuisse gauche",
      nextDoseDate: date("2025-10-04"),
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "VPO",
      dose: 1,
      date: date("2025-08-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "Rota",
      dose: 1,
      date: date("2025-08-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      notes: "Dose orale, bonne tolérance",
    },
  });

  // 4 mois
  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "DTC",
      dose: 2,
      date: date("2025-10-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      batchNumber: "DTC-2025-4401",
      injectionSite: "Cuisse droite",
      nextDoseDate: date("2025-12-04"),
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "VPO",
      dose: 2,
      date: date("2025-10-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: khadija.id,
      vaccine: "Pneumo",
      dose: 2,
      date: date("2025-10-04"),
      clinicName: "Hôpital Mohammed V",
      healthcareProfessionalName: "Dr. Rachid Ouazzani",
      batchNumber: "PNE-2025-0312",
      injectionSite: "Cuisse gauche",
    },
  });

  // Consultations
  await prisma.consultation.create({
    data: {
      childId: khadija.id,
      date: date("2025-07-02"),
      summary:
        "Contrôle à 1 mois. Poids 3.9 kg, taille 52 cm. Bonne prise de poids. Allaitement maternel exclusif.",
      clinicianName: "Dr. Rachid Ouazzani",
      reasonForVisit: "Contrôle du premier mois",
      diagnosis: "Croissance satisfaisante",
      followUpRequired: false,
    },
  });

  await prisma.consultation.create({
    data: {
      childId: khadija.id,
      date: date("2025-10-04"),
      summary:
        "Contrôle à 4 mois. Poids 6.1 kg, taille 62 cm. Début de diversification alimentaire conseillé à 6 mois. Développement psychomoteur normal.",
      clinicianName: "Dr. Rachid Ouazzani",
      reasonForVisit: "Contrôle des 4 mois + vaccination",
      diagnosis: "Développement normal",
      followUpRequired: true,
      followUpDate: date("2025-12-04"),
      treatmentPrescribed: "Vitamine D — 1 goutte/jour",
    },
  });

  // Side-effect report — open, no response yet
  await prisma.sideEffectReport.create({
    data: {
      childId: khadija.id,
      description:
        "Petite bosse dure au niveau de la cuisse droite après le vaccin DTC 2e dose. Pas de fièvre, mais l'enfant pleure quand on touche la zone.",
      severity: "mild",
      status: "open",
    },
  });

  console.log("   ✓ Khadija El Amrani — 9 vaccinations, 2 consultations, 1 signalement (ouvert)");

  // ══════════════════════════════════════════════════════════════════════════
  //  CHILD 3 — Adam Chraibi
  // ══════════════════════════════════════════════════════════════════════════

  const adam = await prisma.child.create({
    data: {
      identifier: "CHR-AC5R-2JDG",
      fullName: "Adam Chraibi",
      birthDate: date("2025-12-01"),
      gender: "male",
      birthWeight: 2.85,
      birthLength: 47,
      headCircumferenceAtBirth: 32.5,
      placeOfBirth: "Clinique Avicenne, Marrakech",
      deliveryType: "voie basse",
      parentName: "Houda Chraibi",
      parentContact: "0699456789",
    },
  });

  // Naissance
  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "BCG",
      dose: 1,
      date: date("2025-12-01"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
      batchNumber: "BCG-2025-0721",
      injectionSite: "Épaule gauche",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "VHB",
      dose: 1,
      date: date("2025-12-01"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
      injectionSite: "Cuisse droite",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "VPO",
      dose: 0,
      date: date("2025-12-01"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
    },
  });

  // 2 mois
  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "DTC",
      dose: 1,
      date: date("2026-02-02"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
      batchNumber: "DTC-2026-0105",
      injectionSite: "Cuisse gauche",
      nextDoseDate: date("2026-04-02"),
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "VPO",
      dose: 1,
      date: date("2026-02-02"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
    },
  });

  await prisma.vaccination.create({
    data: {
      childId: adam.id,
      vaccine: "Rota",
      dose: 1,
      date: date("2026-02-02"),
      clinicName: "Clinique Avicenne",
      healthcareProfessionalName: "Dr. Samir Benjelloun",
      notes: "Dose orale",
    },
  });

  // Consultation — naissance
  await prisma.consultation.create({
    data: {
      childId: adam.id,
      date: date("2025-12-01"),
      summary:
        "Examen néonatal. Poids 2.85 kg (limite basse). Allaitement maternel débuté. Surveillance du poids recommandée.",
      clinicianName: "Dr. Samir Benjelloun",
      reasonForVisit: "Examen néonatal",
      diagnosis: "Petit poids de naissance, surveillance pondérale",
      followUpRequired: true,
      followUpDate: date("2025-12-15"),
    },
  });

  await prisma.consultation.create({
    data: {
      childId: adam.id,
      date: date("2025-12-15"),
      summary:
        "Contrôle pondéral à 2 semaines. Poids 3.05 kg (+200g). Bonne courbe de croissance. Allaitement exclusif en cours.",
      clinicianName: "Dr. Samir Benjelloun",
      reasonForVisit: "Contrôle pondéral",
      diagnosis: "Rattrapage pondéral satisfaisant",
      followUpRequired: false,
    },
  });

  // Side-effect report — severe, with response + prescription already dispensed
  const reportAdam = await prisma.sideEffectReport.create({
    data: {
      childId: adam.id,
      vaccinationId: (
        await prisma.vaccination.findFirst({
          where: { childId: adam.id, vaccine: "DTC", dose: 1 },
        })
      )!.id,
      description:
        "Fièvre élevée à 39.2°C, pleurs inconsolables depuis 8 heures. Gonflement important au site d'injection. L'enfant refuse de téter.",
      severity: "severe",
      status: "prescribed",
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportAdam.id,
      senderRole: "parent",
      content:
        "Docteur, je suis très inquiète, Adam a 39.2°C de fièvre et la cuisse est très gonflée. Il refuse de manger depuis ce matin.",
      createdAt: daysAgo(3),
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportAdam.id,
      senderRole: "clinic",
      content:
        "Mme Chraibi, cette réaction est plus forte que la normale mais reste gérable. Appliquez une compresse froide sur la cuisse. Je vous prescris du paracétamol et de l'ibuprofène en alternance. Si la fièvre ne baisse pas en 2h après le médicament, rendez-vous aux urgences.",
      createdAt: daysAgo(3),
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportAdam.id,
      senderRole: "parent",
      content:
        "D'accord docteur, je vais à la pharmacie tout de suite. Merci beaucoup.",
      createdAt: daysAgo(3),
    },
  });

  await prisma.reportMessage.create({
    data: {
      reportId: reportAdam.id,
      senderRole: "parent",
      content:
        "La fièvre est descendue à 38.1°C après le Doliprane. Il a repris le sein. Merci docteur !",
      createdAt: daysAgo(2),
    },
  });

  await prisma.prescription.create({
    data: {
      code: "ORD-SC3R-7WJG",
      reportId: reportAdam.id,
      childId: adam.id,
      doctorName: "Samir Benjelloun",
      medications:
        "1. Doliprane pédiatrique (paracétamol) — Suspension buvable 2.4%\n   Dose : 45 mg toutes les 6 heures si fièvre > 38°C\n\n2. Advil pédiatrique (ibuprofène) — Suspension buvable\n   Dose : 30 mg toutes les 8 heures EN ALTERNANCE avec le paracétamol",
      instructions:
        "Alterner paracétamol et ibuprofène avec un intervalle de 3 heures.\nMaximum 4 prises de chaque par 24 heures.\nCompresses froides sur le site d'injection.\nSi fièvre > 39.5°C ou convulsions → urgences immédiatement.",
      notes: "Réaction sévère au DTC dose 1. À surveiller pour la dose 2.",
      status: "dispensed",
      dispensedAt: daysAgo(3),
      dispensedBy: "Pharmacie Ibn Sina, Marrakech",
    },
  });

  console.log("   ✓ Adam Chraibi — 6 vaccinations, 2 consultations, 1 signalement + ordonnance dispensée");

  // ══════════════════════════════════════════════════════════════════════════

  console.log("\n✅ Seed complete! 3 children, 21 vaccinations, 6 consultations, 3 reports, 2 prescriptions.\n");
  console.log("   Login credentials:");
  console.log("   ─────────────────────────────────────────────────────");
  console.log("   Parent (Yassine)  → ID: CHR-YB7K-3NHP  Tel: 0661234567");
  console.log("   Parent (Khadija)  → ID: CHR-KE4M-8WRT  Tel: 0677891234");
  console.log("   Parent (Adam)     → ID: CHR-AC5R-2JDG  Tel: 0699456789");
  console.log("   Clinique          → Any email (e.g. clinique@bidaya.ma)");
  console.log("   Pharmacie         → Any email (e.g. pharmacie@bidaya.ma)");
  console.log("   ─────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

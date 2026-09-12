import { FACTOR_VERSION } from "@/data/emission-factors";

export const FACTOR_CHANGELOG = [
  {
    version: "FR-2026.09-impactco2-ngc-4.14.3",
    date: "2026-09-12",
    changes: [
      "Facteur diesel distinct de l’essence.",
      "Facteur avion long-courrier séparé du vol court.",
      "Train : TGV, TER ou mixte selon la déclaration.",
      "Les historiques déjà enregistrés sont recalculés avec cette version.",
    ],
  },
  {
    version: "FR-2026.08-impactco2-ngc-4.14.3",
    date: "2026-08-12",
    changes: [
      "Première version figée pour la bêta France.",
      "Sources principales : Impact CO₂, Base Empreinte ADEME, Agribalyse, Nos Gestes Climat 4.14.3.",
    ],
  },
] as const;

export function currentFactorChangelog() {
  return (
    FACTOR_CHANGELOG.find((entry) => entry.version === FACTOR_VERSION) ??
    FACTOR_CHANGELOG[0]
  );
}

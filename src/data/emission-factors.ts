import type { EmissionFactor } from "@/lib/types";

export const FACTOR_VERSION = "FR-2026.08-impactco2-ngc-4.14.3";
export const IMPACT_CO2_URL = "https://impactco2.fr/outils/api";
export const NGC_URL = "https://nosgestesclimat.fr/documentation";

const meta = {
  region: "FR" as const,
  year: 2026,
  lastUpdated: "2026-08-12",
};

export const emissionFactors: EmissionFactor[] = [
  { id: "car-petrol", category: "transport", subcategory: "car", label: "Voiture essence moyenne, cycle de vie", value: 0.142253, unit: "kgCO2e/km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "car-diesel", category: "transport", subcategory: "car", label: "Voiture diesel moyenne, cycle de vie", value: 0.142253, unit: "kgCO2e/km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "medium", note: "Proxy voiture thermique moyenne en mode rapide.", ...meta },
  { id: "car-hybrid", category: "transport", subcategory: "car", label: "Voiture hybride moyenne", value: 0.118, unit: "kgCO2e/km", source: "Nos Gestes Climat, modèle 4.14.3 / Base Empreinte", sourceUrl: NGC_URL, confidence: "medium", ...meta },
  { id: "car-electric", category: "transport", subcategory: "car", label: "Voiture électrique moyenne, cycle de vie France", value: 0.067365, unit: "kgCO2e/km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "train-tgv", category: "transport", subcategory: "rail", label: "TGV, infrastructure incluse", value: 0.00293, unit: "kgCO2e/passager.km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "transit", category: "transport", subcategory: "transit", label: "Transport collectif urbain, proxy bus/métro", value: 0.045, unit: "kgCO2e/passager.km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "medium", note: "Moyenne prudente de modes urbains en l'absence de détail.", ...meta },
  { id: "motorcycle", category: "transport", subcategory: "motorcycle", label: "Moto thermique > 250 cm³", value: 0.14, unit: "kgCO2e/km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "bike", category: "transport", subcategory: "active", label: "Vélo mécanique, fabrication incluse", value: 0.00017, unit: "kgCO2e/km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "flight", category: "transport", subcategory: "aviation", label: "Avion trajet court, forçage radiatif et infrastructure inclus", value: 0.224572, unit: "kgCO2e/passager.km", source: "Impact CO₂ / Base Empreinte ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "electricity", category: "housing", subcategory: "energy", label: "Mix électrique français", value: 0.0519, unit: "kgCO2e/kWh", source: "Nos Gestes Climat 4.14.3 / Base Empreinte ADEME", sourceUrl: NGC_URL, confidence: "high", ...meta },
  { id: "gas", category: "housing", subcategory: "heating", label: "Gaz naturel, combustion et amont", value: 0.215, unit: "kgCO2e/kWh", source: "Nos Gestes Climat 4.14.3 / Base Empreinte ADEME", sourceUrl: NGC_URL, confidence: "high", ...meta },
  { id: "fuel", category: "housing", subcategory: "heating", label: "Fioul domestique", value: 0.324, unit: "kgCO2e/kWh", source: "Nos Gestes Climat 4.14.3 / Base Empreinte ADEME", sourceUrl: NGC_URL, confidence: "medium", note: "Conversion du facteur officiel par litre avec pouvoir calorifique conventionnel.", ...meta },
  { id: "wood", category: "housing", subcategory: "heating", label: "Bois énergie, cycle de vie", value: 0.03, unit: "kgCO2e/kWh", source: "Nos Gestes Climat 4.14.3 / Base Empreinte ADEME", sourceUrl: NGC_URL, confidence: "medium", ...meta },
  { id: "district", category: "housing", subcategory: "heating", label: "Réseau de chaleur moyen", value: 0.113, unit: "kgCO2e/kWh", source: "Nos Gestes Climat 4.14.3 / Base Empreinte ADEME", sourceUrl: NGC_URL, confidence: "medium", ...meta },
  { id: "beef", category: "food", subcategory: "meat", label: "Bœuf", value: 28.00917, unit: "kgCO2e/kg", source: "Impact CO₂ / Agribalyse ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "pork", category: "food", subcategory: "meat", label: "Porc", value: 6.671305, unit: "kgCO2e/kg", source: "Impact CO₂ / Agribalyse ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "chicken", category: "food", subcategory: "meat", label: "Poulet", value: 4.56043, unit: "kgCO2e/kg", source: "Impact CO₂ / Agribalyse ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "high", ...meta },
  { id: "plant-food", category: "food", subcategory: "plants", label: "Panier végétal, proxy céréales/légumineuses/légumes", value: 1.08, unit: "kgCO2e/kg", source: "Impact CO₂ / Agribalyse ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "medium", note: "Moyenne documentée utilisée uniquement en mode rapide.", ...meta },
  { id: "dairy", category: "food", subcategory: "dairy", label: "Panier produits laitiers", value: 2.8, unit: "kgCO2e/kg", source: "Impact CO₂ / Agribalyse ADEME", sourceUrl: IMPACT_CO2_URL, confidence: "medium", ...meta },
  { id: "purchases-low", category: "purchases", subcategory: "proxy", label: "Biens de consommation — profil sobre", value: 420, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", note: "Forfait comportemental inspectable, à remplacer par des données d'achat précises.", ...meta },
  { id: "purchases-standard", category: "purchases", subcategory: "proxy", label: "Biens de consommation — profil courant", value: 820, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", note: "Forfait comportemental inspectable, à remplacer par des données d'achat précises.", ...meta },
  { id: "purchases-high", category: "purchases", subcategory: "proxy", label: "Biens de consommation — profil intense", value: 1450, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", note: "Forfait comportemental inspectable, à remplacer par des données d'achat précises.", ...meta },
  { id: "public-services", category: "services", subcategory: "societal", label: "Services publics et collectifs", value: 950, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "medium", note: "Part mutualisée de l'empreinte nationale, non directement évitable individuellement.", ...meta },
  { id: "market-services-low", category: "services", subcategory: "market", label: "Services marchands — profil sobre", value: 180, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", ...meta },
  { id: "market-services-standard", category: "services", subcategory: "market", label: "Services marchands — profil courant", value: 360, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", ...meta },
  { id: "market-services-high", category: "services", subcategory: "market", label: "Services marchands — profil intense", value: 620, unit: "kgCO2e/personne.an", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", ...meta },
  { id: "digital-hour", category: "services", subcategory: "digital", label: "Usage numérique moyen", value: 0.018, unit: "kgCO2e/heure", source: "Nos Gestes Climat, modèle 4.14.3", sourceUrl: NGC_URL, confidence: "low", note: "Le terminal et son renouvellement sont comptés dans les achats.", ...meta },
];

export const factorById = Object.fromEntries(
  emissionFactors.map((factor) => [factor.id, factor]),
) as Record<string, EmissionFactor>;

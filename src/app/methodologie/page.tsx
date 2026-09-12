import type { Metadata } from "next";
import { ContentSection, PublicPage } from "@/components/public-page";
import { currentFactorChangelog, FACTOR_CHANGELOG } from "@/data/factor-changelog";
import { emissionFactors, FACTOR_VERSION } from "@/data/emission-factors";
import {
  FRANCE_AVERAGE_KG,
  FRANCE_AVERAGE_SOURCE,
  FRANCE_AVERAGE_URL,
} from "@/lib/benchmark";
import type { EmissionCategory } from "@/lib/types";

export const metadata: Metadata = {
  title: "Méthodologie",
  description:
    "Découvrez comment Carbon OS calcule une empreinte, gère les estimations et documente ses facteurs d’émission.",
  alternates: { canonical: "/methodologie" },
};

const categoryLabels: Record<EmissionCategory, string> = {
  transport: "Transport",
  housing: "Logement",
  food: "Alimentation",
  purchases: "Achats",
  services: "Services",
};

export default function MethodologyPage() {
  return (
    <PublicPage
      eyebrow="Transparence scientifique"
      title="Chaque résultat doit pouvoir être expliqué."
      intro="Carbon OS privilégie une estimation utile et transparente à une précision artificielle. Cette page documente la méthode actuellement utilisée par la bêta française."
    >
      <ContentSection title="La formule de base">
        <div className="rounded-2xl bg-[var(--background)] p-5 font-mono text-sm text-[var(--foreground)]">
          activité annuelle × facteur d’émission = kg CO₂e / an
        </div>
        <p>
          Une activité peut être une distance parcourue, une consommation en
          kWh, une quantité d’aliment ou un profil comportemental. Le facteur
          convertit cette activité en équivalent CO₂ sur un périmètre défini.
        </p>
      </ContentSection>
      <ContentSection title="Rapide ou précis">
        <p>
          Le mode rapide utilise des hypothèses françaises explicites lorsque la
          donnée réelle est inconnue. Le mode précis accepte notamment les
          consommations énergétiques du foyer. Toute activité estimée est
          signalée dans le détail du résultat.
        </p>
        <p>
          Les consommations du logement sont réparties entre les occupants. Une
          pompe à chaleur estimée utilise un coefficient de performance
          conventionnel de 3 ; une consommation électrique réelle déclarée n’est
          pas corrigée une seconde fois.
        </p>
      </ContentSection>
      <ContentSection title="Incertitude et indicateurs expérimentaux">
        <p>
          La fourchette affichée dépend de la part de lignes estimées dans le
          bilan, pas d’un intervalle statistique. L’interface indique le nombre
          de postes estimés plutôt qu’un pourcentage de fiabilité trop précis.
        </p>
        <p>
          L’indice trajectoire est un repère de produit expérimental. Il ne
          constitue ni un percentile national, ni une certification, ni une
          évaluation morale de l’utilisateur.
        </p>
      </ContentSection>
      <ContentSection title="Comparaisons">
        <p>
          Le résultat se compare à environ{" "}
          {String(FRANCE_AVERAGE_KG / 1000).replace(".", ",")} t CO₂e par
          habitant. {FRANCE_AVERAGE_SOURCE}{" "}
          <a
            href={FRANCE_AVERAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--foreground)] underline"
          >
            Source SDES
          </a>
          .
        </p>
        <p>
          Carbon OS ne compare que des empreintes de consommation exprimées sur
          des périmètres suffisamment cohérents. Une émission territoriale et
          une empreinte intégrant les importations ne doivent pas être placées
          sur la même échelle sans avertissement méthodologique.
        </p>
      </ContentSection>
      <ContentSection id="facteurs" title="Mises à jour des facteurs">
        <p>
          Version courante : {currentFactorChangelog().version}. Quand les facteurs changent, les
          bilans déjà enregistrés sont recalculés avec le moteur actuel pour
          que l’historique reste comparable.
        </p>
        <ol className="mt-4 space-y-4">
          {FACTOR_CHANGELOG.map((entry) => (
            <li key={entry.version}>
              <p className="font-semibold text-[var(--foreground)]">
                {entry.version} · {entry.date}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </ContentSection>
      <section className="panel overflow-hidden">
        <div className="border-b border-[var(--border)] p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-[-.025em]">
            Registre des facteurs
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {emissionFactors.length} facteurs · version {FACTOR_VERSION}
          </p>
        </div>
        <div>
          {emissionFactors.map((factor) => (
            <a
              key={factor.id}
              href={factor.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="grid gap-3 border-b border-[var(--border)] p-5 last:border-0 hover:bg-[var(--surface)] sm:grid-cols-[1fr_auto] sm:px-8"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {factor.label}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                  {categoryLabels[factor.category]} · {factor.source} · année{" "}
                  {factor.year}
                </span>
                {factor.note && (
                  <span className="mt-2 block text-[11px] leading-5 text-[var(--orange)]">
                    Limite : {factor.note}
                  </span>
                )}
              </span>
              <span className="sm:text-right">
                <span className="block font-mono text-sm">
                  {String(factor.value).replace(".", ",")}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {factor.unit} · confiance {factor.confidence}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}

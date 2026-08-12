import type { Metadata } from "next";
import { ContentSection, PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Informations légales relatives à la bêta Carbon OS.",
  alternates: { canonical: "/mentions-legales" },
};

export default function LegalPage() {
  return (
    <PublicPage
      eyebrow="Informations légales"
      title="Une bêta transparente jusque dans ses limites."
      intro="Carbon OS est actuellement un prototype public en phase de validation produit et méthodologique."
    >
      <ContentSection title="Édition">
        <p>
          Carbon OS est un projet expérimental développé et publié par l’auteur
          du dépôt open source teocomyn/Carbon-OS. Les informations complètes de
          l’éditeur devront être ajoutées ici avant toute ouverture commerciale
          ou collecte de comptes utilisateurs.
        </p>
        <p>
          Contact et suivi technique :{" "}
          <a
            href="https://github.com/teocomyn/Carbon-OS"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--foreground)] underline"
          >
            dépôt GitHub Carbon OS
          </a>
          .
        </p>
      </ContentSection>
      <ContentSection title="Hébergement">
        <p>
          Le service est hébergé par Vercel Inc., 440 N Barranca Ave #4133,
          Covina, CA 91723, États-Unis. Le domaine de démonstration est fourni
          par la plateforme Vercel.
        </p>
      </ContentSection>
      <ContentSection title="Limitation méthodologique">
        <p>
          Les résultats sont des estimations d’aide à la compréhension. Ils ne
          constituent ni un bilan carbone réglementaire, ni une certification,
          ni un conseil financier ou énergétique professionnel.
        </p>
      </ContentSection>
      <ContentSection title="Propriété et sources">
        <p>
          L’interface et le code du projet suivent les conditions publiées dans
          le dépôt associé. Les données tierces restent soumises aux licences et
          conditions de leurs producteurs, notamment ADEME, Impact CO₂,
          Agribalyse et Nos Gestes Climat.
        </p>
      </ContentSection>
    </PublicPage>
  );
}

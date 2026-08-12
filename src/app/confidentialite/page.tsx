import type { Metadata } from "next";
import { ContentSection, PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Confidentialité",
  description:
    "Découvrez comment la bêta Carbon OS protège et minimise vos données personnelles.",
  alternates: { canonical: "/confidentialite" },
};

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Confidentialité"
      title="Vos habitudes vous appartiennent."
      intro="La bêta actuelle fonctionne sans compte et limite volontairement la collecte de données. Les informations ci-dessous décrivent le comportement de cette version."
    >
      <ContentSection title="Données du questionnaire">
        <p>
          Les réponses concernant vos transports, votre logement, votre
          alimentation et vos achats sont enregistrées dans le stockage local de
          votre navigateur. Elles ne sont pas envoyées à une base de données
          Carbon OS dans cette V1.
        </p>
      </ContentSection>
      <ContentSection title="Hébergement et journaux techniques">
        <p>
          Le site est hébergé par Vercel. Comme tout hébergeur web, Vercel peut
          traiter des informations techniques nécessaires à la livraison et à la
          sécurité du service, telles que l’adresse IP, l’agent utilisateur ou
          les journaux de requêtes.
        </p>
      </ContentSection>
      <ContentSection title="Export et suppression">
        <p>
          Depuis le dashboard, vous pouvez exporter votre bilan au format JSON
          ou supprimer immédiatement les réponses et l’objectif enregistrés
          localement. La suppression ne nécessite aucun compte.
        </p>
      </ContentSection>
      <ContentSection title="Mesure d’audience">
        <p>
          Aucun outil d’analyse comportementale transmettant les réponses
          détaillées du questionnaire n’est intégré à cette bêta. Si une mesure
          d’audience est ajoutée, elle exclura les réponses carbone et sera
          documentée ici.
        </p>
      </ContentSection>
      <ContentSection title="Évolution de cette politique">
        <p>
          La création de compte sera optionnelle et proposée seulement après le
          calcul. Elle nécessitera un consentement explicite, un export complet
          et une suppression du compte. Dernière mise à jour : 12 août 2026.
        </p>
      </ContentSection>
    </PublicPage>
  );
}

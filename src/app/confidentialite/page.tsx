import type { Metadata } from "next";
import { ContentSection, PublicPage } from "@/components/public-page";
import { legalIdentity } from "@/lib/legal";

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
      intro="Carbon OS fonctionne sans compte. Si vous choisissez la synchronisation, seules les données nécessaires au suivi de vos bilans sont enregistrées dans votre espace privé."
    >
      <ContentSection title="Utilisation sans compte">
        <p>
          Les réponses concernant vos transports, votre logement, votre
          alimentation et vos achats sont enregistrées dans le stockage local de
          votre navigateur. Sans compte, elles ne sont pas envoyées à la base de
          données Carbon OS.
        </p>
      </ContentSection>
      <ContentSection title="Compte et synchronisation facultatifs">
        <p>
          Si vous demandez un lien de connexion, Supabase traite votre adresse
          e-mail pour authentifier votre session. Une fois connecté, Carbon OS
          synchronise vos réponses, résultats, dates de bilan et objectif. Les
          règles de sécurité de la base limitent chaque utilisateur à ses
          propres lignes.
        </p>
        <p>
          La région d’hébergement de la base et la durée de conservation devront
          être consignées dans le registre de traitement avant l’ouverture large
          de la bêta.
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
          Depuis le dashboard, vous pouvez exporter votre bilan et son
          historique au format JSON. Le bouton de suppression efface les données
          locales et, si vous êtes connecté, les bilans synchronisés. La page
          Mon compte permet également de supprimer définitivement le compte.
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
      <ContentSection title="Vos droits et contact">
        <p>
          Vous pouvez demander l’accès, la rectification, l’effacement ou la
          portabilité de vos données. Le contact responsable est{" "}
          {legalIdentity.email ? (
            <a
              className="font-semibold text-[var(--foreground)] underline"
              href={`mailto:${legalIdentity.email}`}
            >
              {legalIdentity.email}
            </a>
          ) : (
            "à compléter avant l’activation publique des comptes"
          )}
          . Dernière mise à jour : 12 août 2026.
        </p>
      </ContentSection>
    </PublicPage>
  );
}

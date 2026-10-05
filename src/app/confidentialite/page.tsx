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
          synchronise vos réponses, résultats, dates de bilan, objectif et plan
          d’actions. Les règles de sécurité de la base limitent chaque
          utilisateur à ses propres lignes.
        </p>
        <p>
          Sans compte, les données restent dans le navigateur jusqu’à
          suppression manuelle ou vidage du stockage. Avec un compte, les
          bilans synchronisés sont conservés jusqu’à suppression du compte ou
          des données. La base Supabase du projet est hébergée dans la région
          européenne Paris (eu-west-3).
        </p>
      </ContentSection>
      <ContentSection title="Hébergement et journaux techniques">
        <p>
          Le site est hébergé par Vercel. Comme tout hébergeur web, Vercel peut
          traiter des informations techniques nécessaires à la livraison et à la
          sécurité du service, telles que l’adresse IP, l’agent utilisateur ou
          les journaux de requêtes.
        </p>
        <p>
          Pour limiter les abus, Carbon OS conserve dans Supabase des compteurs
          de requêtes associés à une empreinte cryptographique de l’adresse IP,
          et non à l’adresse brute. Ils expirent au bout de dix minutes au
          maximum et les compteurs expirés sont supprimés lors des requêtes
          suivantes. Ils ne contiennent ni réponses au bilan ni e-mail.
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
          Carbon OS utilise Vercel Web Analytics pour mesurer uniquement des
          étapes générales du parcours, sans cookie publicitaire. Les paramètres
          des adresses web sont supprimés avant l’envoi. Les événements peuvent
          indiquer qu’un questionnaire a commencé ou été terminé, son mode, sa
          durée arrondie, le chapitre d’un abandon, qu’une action, un objectif
          ou un compte a été activé, ou un retour produit limité à trois choix
          catégoriels (clarté, confiance, suite).
        </p>
        <p>
          Les réponses détaillées, le régime alimentaire, les consommations
          énergétiques, l’adresse e-mail et le montant individuel exact du bilan
          ne sont jamais ajoutés aux événements de mesure. Les signaux Global
          Privacy Control et Do Not Track sont respectés par Carbon OS.
        </p>
      </ContentSection>
      <ContentSection title="Conseiller carbone facultatif">
        <p>
          Si vous envoyez une question au conseiller, vos messages et un résumé
          de votre bilan (total et catégories arrondis, objectif, actions et
          recommandations) sont transmis à Vercel AI Gateway et au fournisseur
          du modèle OpenAI pour produire une réponse. Les réponses détaillées
          du questionnaire et votre e-mail ne sont pas ajoutés automatiquement.
        </p>
        <p>
          Carbon OS ne conserve pas l’historique du chat dans sa base. Cela ne
          signifie pas une absence de traitement ou de conservation technique
          chez les fournisseurs. N’ajoutez pas de données sensibles à vos
          questions. Le conseiller ne calcule pas votre empreinte et ses
          suggestions restent indicatives.
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
          . Dernière mise à jour : 5 octobre 2026.
        </p>
      </ContentSection>
    </PublicPage>
  );
}

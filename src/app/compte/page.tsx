import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";
import { ContentSection, PublicPage } from "@/components/public-page";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Synchronisez facultativement votre historique Carbon OS.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const configured = isSupabaseConfigured();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <PublicPage
      className="process-shell account-shell"
      eyebrow="Compte facultatif"
      title={
        user
          ? "Votre historique vous suit."
          : "Local d’abord. Synchronisé si vous le choisissez."
      }
      intro="Créer un compte n’est jamais nécessaire pour calculer votre empreinte. Il sert uniquement à retrouver vos bilans sur plusieurs appareils et à suivre votre progression dans le temps."
    >
      <AccountPanel configured={configured} email={user?.email ?? null} />
      <ContentSection title="Ce qui est synchronisé">
        <p>
          Vos réponses au questionnaire, les résultats calculés, la date de
          chaque bilan et votre objectif personnel. Aucun profil public,
          classement ou revente de données n’est prévu.
        </p>
      </ContentSection>
      <ContentSection title="Sécurité par défaut">
        <p>
          Chaque ligne distante est associée à votre identifiant privé. Les
          règles Row Level Security de PostgreSQL autorisent uniquement votre
          propre session à lire, ajouter, modifier ou supprimer ces données.
        </p>
      </ContentSection>
    </PublicPage>
  );
}

import type { Metadata } from "next";
import { AccountPanel } from "@/components/account/account-panel";
import { Logo } from "@/components/logo";
import { ContentSection, PublicPage } from "@/components/public-page";
import { CARBON_SIGNAL_VIDEO } from "@/lib/media";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Synchronisez facultativement votre historique Carbon OS.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ connexion?: string | string[] }>;
}) {
  const connexion = (await searchParams).connexion;
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
          : "Un compte, seulement si vous le souhaitez."
      }
      intro="Sans compte, tout fonctionne sur cet appareil. Activez la synchronisation uniquement pour retrouver vos bilans et suivre votre progression ailleurs."
    >
      <div className="account-vault-grid">
        <section
          className="account-vault-visual"
          aria-label="Coffre de données Carbon OS"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src={CARBON_SIGNAL_VIDEO} type="video/mp4" />
          </video>
          <div className="account-vault-wash" />
          <div className="account-vault-content">
            <Logo compact />
            <div>
              <p className="account-vault-code">VAULT / PRIVATE / 01</p>
              <p className="account-vault-title">
                Vos données.
                <br /> Votre décision.
              </p>
              <p className="account-vault-caption">
                Local par défaut. Chiffré en transit si vous activez la
                synchronisation.
              </p>
            </div>
            <p className="account-vault-status">
              <span /> Aucune identité publique
            </p>
          </div>
        </section>
        <div className="account-vault-panel">
          <AccountPanel
            configured={configured}
            email={user?.email ?? null}
            initialMessage={
              connexion === "ok"
                ? "Connexion réussie. Votre historique peut maintenant être synchronisé."
                : connexion === "erreur"
                  ? "Le lien est invalide ou a expiré. Demandez-en un nouveau."
                  : ""
            }
          />
        </div>
      </div>
      <ContentSection title="Ce qui est synchronisé">
        <p>
          Vos réponses au questionnaire, les résultats calculés, la date de
          chaque bilan, votre objectif et votre plan de trois actions. Aucun
          profil public, classement ou revente de données n’est prévu.
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

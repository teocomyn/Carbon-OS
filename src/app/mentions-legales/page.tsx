import type { Metadata } from "next";
import { ContentSection, PublicPage } from "@/components/public-page";
import { isLegalIdentityComplete, legalIdentity } from "@/lib/legal";

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
        {isLegalIdentityComplete ? (
          <div className="space-y-2">
            <p>
              <strong className="text-[var(--foreground)]">Éditeur :</strong>{" "}
              {legalIdentity.name}
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Statut :</strong>{" "}
              {legalIdentity.status}
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Adresse :</strong>{" "}
              {legalIdentity.address}
            </p>
            {legalIdentity.registration && (
              <p>
                <strong className="text-[var(--foreground)]">
                  Immatriculation :
                </strong>{" "}
                {legalIdentity.registration}
              </p>
            )}
            <p>
              <strong className="text-[var(--foreground)]">Contact :</strong>{" "}
              <a className="underline" href={`mailto:${legalIdentity.email}`}>
                {legalIdentity.email}
              </a>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--orange)] bg-[var(--surface)] p-5">
            <p className="font-semibold text-[var(--foreground)]">
              Identité de l’éditeur à finaliser
            </p>
            <p className="mt-2">
              Le nom ou la raison sociale, le statut, l’adresse et l’e-mail de
              contact doivent être renseignés dans les variables légales du
              déploiement avant l’activation publique des comptes.
            </p>
          </div>
        )}
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
        <p>
          Lorsque la synchronisation facultative est activée, l’authentification
          et la base PostgreSQL sont opérées par Supabase. La région exacte du
          projet devra être ajoutée ici lors de la configuration de production.
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

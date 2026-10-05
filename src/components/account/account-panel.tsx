"use client";

import { readBrowserStorage, writeBrowserStorage } from "@/lib/browser-storage";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Check, Cloud, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearLocalData } from "@/lib/clear-local-data";
import { trackCarbonEvent } from "@/lib/analytics";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function AccountPanel({
  configured,
  canDeleteAccount = false,
  email,
  initialMessage = "",
}: {
  configured: boolean;
  canDeleteAccount?: boolean;
  email: string | null;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    if (!email || !initialMessage.startsWith("Connexion réussie")) return;
    const key = "carbon-os-account-activated-tracked-v1";
    if (readBrowserStorage(key)) return;
    trackCarbonEvent({ name: "Compte activé" });
    writeBrowserStorage(key, "1");
  }, [email, initialMessage]);

  const requestMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setPending(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: address.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken,
        },
      });
      if (turnstileSiteKey) {
        setCaptchaToken(undefined);
        setCaptchaKey((current) => current + 1);
      }
      setPending(false);
      setMessage(
        error
          ? "Impossible d’envoyer le lien pour le moment."
          : "Lien envoyé. Vérifiez votre boîte mail pour continuer.",
      );
    } catch {
      setMessage("Connexion indisponible. Vos bilans locaux sont conservés.");
    } finally {
      setPending(false);
    }
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setPending(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.refresh();
    } catch {
      setMessage("La déconnexion a échoué. Réessayez.");
    } finally {
      setPending(false);
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Supprimer définitivement le compte et tous les bilans synchronisés ?",
      )
    )
      return;
    if (
      !window.confirm(
        "Dernière confirmation : cette action est irréversible. Continuer ?",
      )
    )
      return;
    setPending(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok) {
        clearLocalData();
        await createSupabaseBrowserClient()?.auth.signOut({ scope: "local" });
        router.push("/?compte=supprime");
        router.refresh();
      } else {
        setMessage("La suppression n’a pas abouti. Réessayez plus tard.");
      }
    } catch {
      setMessage(
        "Suppression non confirmée. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setPending(false);
    }
  };

  if (!configured) {
    return (
      <section className="account-card panel border-[var(--accent)] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Cloud size={20} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">
              Synchronisation bientôt disponible
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Votre historique fonctionne déjà sur cet appareil. Nous ouvrirons
              la synchronisation entre plusieurs appareils dès qu’elle sera
              entièrement prête et testée.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/dashboard">Continuer sans compte</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (email) {
    return (
      <section className="account-card panel p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--positive-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--positive)]">
              <Check size={14} /> Compte actif
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-.035em] [overflow-wrap:anywhere]">
              {email}
            </h2>
            <p className="mt-2 max-w-[560px] text-sm leading-6 text-[var(--muted-foreground)]">
              Ouvrez votre dashboard pour fusionner automatiquement les bilans
              de cet appareil avec votre historique sécurisé.
            </p>
          </div>
          <ShieldCheck className="text-[var(--positive)]" size={28} />
        </div>
        <div className="mt-7 flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
          <Button asChild variant="accent">
            <Link href="/dashboard">Voir ma progression</Link>
          </Button>
          <Button variant="secondary" onClick={signOut} disabled={pending}>
            <LogOut size={15} /> Se déconnecter
          </Button>
          <Button
            variant="ghost"
            onClick={deleteAccount}
            disabled={pending || !canDeleteAccount}
          >
            <Trash2 size={15} /> Supprimer le compte
          </Button>
        </div>
        {!canDeleteAccount && (
          <p
            role="status"
            className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]"
          >
            La suppression du compte est temporairement indisponible : la
            configuration serveur doit être complétée. Vous pouvez supprimer vos
            bilans synchronisés depuis les données du tableau de bord.
          </p>
        )}
        {message && (
          <p
            className="mt-4 text-xs text-[var(--muted-foreground)]"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="account-card panel p-6 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-[-.035em]">
        Recevoir un lien sécurisé
      </h2>
      <p className="mt-2 max-w-[600px] text-sm leading-6 text-[var(--muted-foreground)]">
        Aucun mot de passe à mémoriser. Le lien à usage unique crée ou ouvre
        votre compte, puis votre historique local est fusionné sans doublon.
      </p>
      <form onSubmit={requestMagicLink} className="mt-7 max-w-[620px]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="account-email">
            Adresse e-mail
          </label>
          <input
            id="account-email"
            type="email"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            autoComplete="email"
            placeholder="vous@exemple.fr"
            className="h-11 min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-5 text-sm focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--positive)]"
          />
          <Button
            type="submit"
            variant="accent"
            loading={pending}
            loadingText="Envoi en cours…"
            disabled={pending || Boolean(turnstileSiteKey && !captchaToken)}
          >
            Envoyer le lien
          </Button>
        </div>
        {turnstileSiteKey && (
          <div className="mt-4 overflow-hidden rounded-xl">
            <Turnstile
              key={captchaKey}
              siteKey={turnstileSiteKey}
              onSuccess={setCaptchaToken}
              onExpire={() => setCaptchaToken(undefined)}
              onError={() => {
                setCaptchaToken(undefined);
                setMessage(
                  "La vérification anti-robot n’a pas abouti. Rechargez la page pour réessayer.",
                );
              }}
            />
          </div>
        )}
      </form>
      {message && (
        <p
          className="mt-4 text-xs font-medium text-[var(--muted-foreground)]"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </section>
  );
}

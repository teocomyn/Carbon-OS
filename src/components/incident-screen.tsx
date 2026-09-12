import Link from "next/link";
import { Logo } from "@/components/logo";
import { SkipLink } from "@/components/skip-link";
import { Button } from "@/components/ui/button";

export function IncidentScreen({
  title = "L’interface a rencontré un problème.",
  description = "Vos réponses restent dans ce navigateur. Rechargez la page ou recommencez le bilan.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <main
      id="incident"
      className="grid min-h-screen place-items-center bg-[var(--background)] px-5 text-center text-[var(--foreground)]"
    >
      <SkipLink href="#incident" />
      <div className="max-w-[460px]">
        <Logo />
        <p className="eyebrow mt-10">Incident local</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-.04em]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry && (
            <Button type="button" variant="accent" onClick={onRetry}>
              Réessayer
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link href="/">Accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

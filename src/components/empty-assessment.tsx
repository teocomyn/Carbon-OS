import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Logo } from "@/components/logo";
import { SkipLink } from "@/components/skip-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function EmptyAssessment({
  title = "Votre bilan n’est pas encore là.",
  description = "Carbon OS n’affiche un résultat que lorsque vous avez répondu au questionnaire. Aucun profil d’exemple n’est présenté comme le vôtre.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main
      id="overview"
      className="process-shell grid min-h-screen place-items-center bg-[var(--background)] px-5 text-[var(--foreground)]"
    >
      <SkipLink href="#overview" />
      <div className="w-full max-w-[560px] text-center">
        <div className="mb-10 flex items-center justify-center gap-3">
          <Logo />
          <ThemeToggle />
        </div>
        <p className="eyebrow">Aucun bilan sur cet appareil</p>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-[460px] text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg">
            <Link href="/questionnaire">
              Faire mon bilan · 4 min <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/methodologie">Voir la méthode</Link>
          </Button>
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <LockKeyhole size={13} />
          Calculé dans votre navigateur · aucun compte requis
        </p>
      </div>
    </main>
  );
}

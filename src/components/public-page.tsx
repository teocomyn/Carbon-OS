import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function PublicPage({
  eyebrow,
  title,
  intro,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={className}>
      <SiteHeader />
      <article className="mx-auto max-w-[900px] px-5 pb-24 pt-32 sm:pt-40 lg:px-8">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={15} /> Retour à l’accueil
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="balance mt-5 text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-[720px] text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
          {intro}
        </p>
        <div className="mt-14 space-y-5">{children}</div>
      </article>
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[900px] flex-col justify-between gap-4 px-5 py-8 text-xs text-[var(--muted-foreground)] sm:flex-row lg:px-8">
          <p>© 2026 Carbon OS</p>
          <nav
            className="flex flex-wrap gap-5"
            aria-label="Informations légales"
          >
            <Link
              href="/methodologie"
              className="hover:text-[var(--foreground)]"
            >
              Méthodologie
            </Link>
            <Link
              href="/confidentialite"
              className="hover:text-[var(--foreground)]"
            >
              Confidentialité
            </Link>
            <Link
              href="/mentions-legales"
              className="hover:text-[var(--foreground)]"
            >
              Mentions légales
            </Link>
            <Link href="/compte" className="hover:text-[var(--foreground)]">
              Mon compte
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-.025em]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted-foreground)]">
        {children}
      </div>
    </section>
  );
}

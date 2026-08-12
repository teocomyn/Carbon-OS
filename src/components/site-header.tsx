import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-[color:var(--background)/.78] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:var(--background)/.72]">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav
          className="hidden items-center gap-8 text-sm text-[var(--muted-foreground)] md:flex"
          aria-label="Navigation principale"
        >
          <Link
            href="/methodologie"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Méthode
          </Link>
          <Link
            href="#experience"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Produit
          </Link>
          <Link
            href="/confidentialite"
            className="transition-colors hover:text-[var(--foreground)]"
          >
            Confidentialité
          </Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/questionnaire">Commencer</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-6"><div className="text-center"><Logo /><p className="mt-12 text-8xl font-semibold tracking-tighter">404</p><h1 className="mt-4 text-2xl font-semibold">Cette page n’émet rien.</h1><p className="mt-2 text-[var(--muted-foreground)]">Elle n’existe simplement pas.</p><Button asChild className="mt-8"><Link href="/">Retour à l’accueil</Link></Button></div></main>;
}

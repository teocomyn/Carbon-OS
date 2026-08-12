import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label="Carbon OS — Accueil">
      <span className="relative grid size-7 place-items-center overflow-hidden rounded-[9px] bg-[var(--foreground)]">
        <span className="size-2.5 rounded-full bg-[var(--background)] transition-transform duration-300 group-hover:scale-125" />
        <span className="absolute -bottom-2 -right-2 size-5 rounded-full bg-[var(--accent)]" />
      </span>
      {!compact && <span className="text-sm font-bold tracking-[-0.02em]">CARBON <span className="font-medium text-[var(--muted-foreground)]">OS</span></span>}
    </Link>
  );
}

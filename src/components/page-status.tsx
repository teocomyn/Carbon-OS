import { Logo } from "@/components/logo";

export function PageStatus({
  label = "Chargement",
}: {
  label?: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)]">
      <div className="text-center" role="status" aria-live="polite">
        <Logo />
        <div
          className="mx-auto mt-8 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
          aria-hidden="true"
        />
        <p className="sr-only">{label}</p>
      </div>
    </main>
  );
}

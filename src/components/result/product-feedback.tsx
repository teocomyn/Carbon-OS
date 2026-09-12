"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackCarbonEvent } from "@/lib/analytics";
import {
  readProductFeedback,
  writeProductFeedback,
  type FeedbackClarity,
  type FeedbackFollowUp,
  type ProductFeedback as StoredFeedback,
} from "@/lib/product-feedback";

const clarityOptions: { value: FeedbackClarity; label: string }[] = [
  { value: "haute", label: "Claire" },
  { value: "moyenne", label: "Moyenne" },
  { value: "basse", label: "Confuse" },
];

const trustOptions: { value: FeedbackClarity; label: string }[] = [
  { value: "haute", label: "Je fais confiance" },
  { value: "moyenne", label: "J’hésite" },
  { value: "basse", label: "Je doute" },
];

const followOptions: { value: FeedbackFollowUp; label: string }[] = [
  { value: "action", label: "Je choisis une action" },
  { value: "plus_tard", label: "Je reviendrai" },
  { value: "incompris", label: "Je ne sais pas par où commencer" },
];

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-10 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
              value === option.value
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ProductFeedback() {
  const [ready, setReady] = useState(false);
  const [existing, setExisting] = useState<StoredFeedback | null>(null);
  const [clarte, setClarte] = useState<FeedbackClarity | null>(null);
  const [confiance, setConfiance] = useState<FeedbackClarity | null>(null);
  const [suite, setSuite] = useState<FeedbackFollowUp | null>(null);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setExisting(readProductFeedback());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  if (!ready) return null;

  if (existing) {
    return (
      <section
        className="mx-auto mt-12 max-w-[760px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-6 text-[var(--muted-foreground)]"
        role="status"
        aria-live="polite"
      >
        <p className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]">
          <Check size={16} className="text-[var(--positive)]" />
          Merci, votre retour reste sur cet appareil.
        </p>
        <p className="mt-2">
          Il nous sert à clarifier le parcours, pas à vous identifier.
        </p>
      </section>
    );
  }

  return (
    <form
      className="mx-auto mt-12 max-w-[760px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!clarte || !confiance || !suite) return;
        const stored = writeProductFeedback({ clarte, confiance, suite });
        trackCarbonEvent({
          name: "Retour produit",
          data: {
            clarte: stored.clarte,
            confiance: stored.confiance,
            suite: stored.suite,
          },
        });
        setExisting(stored);
      }}
    >
      <p className="text-sm font-semibold">Trois questions pour améliorer Carbon OS</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
        Réponses agrégées uniquement. Aucun texte libre, aucun e-mail.
      </p>
      <div className="mt-6 space-y-5">
        <ChoiceRow
          label="Le résultat est-il clair ?"
          value={clarte}
          options={clarityOptions}
          onChange={setClarte}
        />
        <ChoiceRow
          label="Faites-vous confiance à l’estimation ?"
          value={confiance}
          options={trustOptions}
          onChange={setConfiance}
        />
        <ChoiceRow
          label="Quelle est votre prochaine étape ?"
          value={suite}
          options={followOptions}
          onChange={setSuite}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="mt-6"
        disabled={!clarte || !confiance || !suite}
      >
        Envoyer mon retour
      </Button>
    </form>
  );
}

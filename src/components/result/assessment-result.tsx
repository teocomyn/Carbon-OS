"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Leaf,
  LockKeyhole,
  PencilLine,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { defaultAnswers, STORAGE_KEY } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";
import { trackCarbonEvent } from "@/lib/analytics";
import { buildScenarios } from "@/lib/recommendations";
import type { AssessmentAnswers } from "@/lib/types";
import { formatKg, formatTons } from "@/lib/utils";
import { assessmentAnswersSchema } from "@/lib/validation";

const FRANCE_AVERAGE_KG = 8_200;

export function AssessmentResult() {
  const [answers, setAnswers] = useState<AssessmentAnswers>(defaultAnswers);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    trackCarbonEvent({ name: "Résultat consulté" });
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const parsed = assessmentAnswersSchema.safeParse(
          JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"),
        );
        if (parsed.success) setAnswers(parsed.data);
      } catch {}
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const result = useMemo(() => calculateAssessment(answers), [answers]);
  const scenarios = useMemo(() => buildScenarios(answers), [answers]);
  const topCategories = [...result.categories]
    .sort((left, right) => right.kgCo2e - left.kgCo2e)
    .slice(0, 3);
  const topAction = scenarios[0];
  const difference = Math.round(
    ((FRANCE_AVERAGE_KG - result.totalKg) / FRANCE_AVERAGE_KG) * 100,
  );
  const confidenceLabel =
    result.confidenceScore >= 80
      ? "élevée"
      : result.confidenceScore >= 60
        ? "moyenne"
        : "à affiner";

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)]">
        <div className="text-center">
          <Logo />
          <div className="mx-auto mt-8 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </main>
    );
  }

  return (
    <main className="process-shell result-shell min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 text-xs text-[var(--muted-foreground)] sm:flex">
              <LockKeyhole size={14} className="text-[var(--positive)]" />
              Calculé dans votre navigateur
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="result-content mx-auto max-w-[1040px] px-5 py-10 sm:py-16 lg:px-8 lg:py-20">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="eyebrow">Votre résultat essentiel</p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">
            Votre empreinte est estimée à
          </h1>
          <p className="number-tabular mt-7 text-[clamp(5.5rem,18vw,10rem)] font-semibold leading-none tracking-[-.09em] text-[var(--accent)]">
            {formatTons(result.totalKg)}
          </p>
          <p className="mt-3 text-base font-medium text-[var(--muted-foreground)]">
            tonnes CO₂e par an
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs">
            <span className="rounded-full bg-[var(--positive-soft)] px-3 py-2 font-medium text-[var(--positive)]">
              {difference >= 0
                ? `${difference} % sous la moyenne française`
                : `${Math.abs(difference)} % au-dessus de la moyenne française`}
            </span>
            <span className="rounded-full bg-[var(--surface)] px-3 py-2 text-[var(--muted-foreground)]">
              Fiabilité {confidenceLabel}
            </span>
          </div>
        </motion.section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <div className="panel p-6 sm:p-8">
            <p className="text-sm font-semibold">Ce qui pèse le plus</p>
            <div className="mt-7 space-y-6">
              {topCategories.map((category, index) => {
                const share = Math.round(
                  (category.kgCo2e / result.totalKg) * 100,
                );
                return (
                  <div key={category.category}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-3 font-medium">
                        <span className="grid size-7 place-items-center rounded-full bg-[var(--surface)] text-xs text-[var(--muted-foreground)]">
                          {index + 1}
                        </span>
                        {category.label}
                      </span>
                      <span className="font-semibold">
                        {formatKg(category.kgCo2e)} · {share} %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${share}%` }}
                        transition={{
                          delay: 0.15 + index * 0.08,
                          duration: 0.55,
                        }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Button asChild variant="ghost" className="mt-7 px-0">
              <Link href="/dashboard?view=understand">
                Comprendre mon calcul <ArrowRight size={15} />
              </Link>
            </Button>
          </div>

          {topAction && (
            <div className="overflow-hidden rounded-[24px] bg-[#12372a] p-6 text-white sm:p-8">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#8fefcf]">
                <Sparkles size={20} />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[.12em] text-white/50">
                Votre meilleure première action
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-.035em]">
                {topAction.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {topAction.description}
              </p>
              <p className="mt-8 text-3xl font-semibold tracking-[-.05em] text-[#8fefcf]">
                −{formatKg(topAction.savingKg)}
              </p>
              <p className="mt-1 text-xs text-white/50">
                potentiellement par an
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 text-center">
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg">
              <Link href="/dashboard?view=act">
                Voir mes 3 actions <ArrowRight size={17} />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/questionnaire">
                <PencilLine size={16} /> Affiner mes réponses
              </Link>
            </Button>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Check size={13} className="text-[var(--positive)]" />
            Aucun compte nécessaire pour continuer
          </p>
        </section>

        <details className="group mx-auto mt-12 max-w-[760px] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
            Comment ce résultat est-il calculé ?
            <ChevronDown
              size={16}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-5 text-sm leading-6 text-[var(--muted-foreground)]">
            <p>
              Nous multiplions vos activités annuelles par des facteurs
              d’émission publics ou reconnus, puis additionnons les cinq grands
              postes de votre quotidien.
            </p>
            <p>
              Fourchette indicative : {formatTons(result.lowKg)} à{" "}
              {formatTons(result.highKg)} t CO₂e/an. Votre résultat reste une
              estimation, pas un bilan carbone réglementaire.
            </p>
            <Link
              href="/methodologie"
              className="inline-flex items-center gap-2 font-semibold text-[var(--accent)] hover:underline"
            >
              Lire la méthodologie <Leaf size={14} />
            </Link>
          </div>
        </details>
      </div>
    </main>
  );
}

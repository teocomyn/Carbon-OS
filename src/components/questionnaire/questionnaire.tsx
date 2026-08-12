"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bike,
  Building2,
  Bus,
  Car,
  Check,
  ChevronLeft,
  Clock3,
  Gauge,
  Home,
  Leaf,
  MapPin,
  ShieldCheck,
  Signal,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Utensils,
  Waves,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  defaultAnswers,
  GOAL_STORAGE_KEY,
  QUESTIONNAIRE_DRAFT_KEY,
  STORAGE_KEY,
} from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";
import {
  addLocalSnapshot,
  createAssessmentSnapshot,
  readLocalHistory,
} from "@/lib/history";
import {
  roundedDurationSeconds,
  secondAssessmentDelay,
  trackCarbonEvent,
  type QuestionnaireChapter,
} from "@/lib/analytics";
import { CARBON_SIGNAL_VIDEO } from "@/lib/media";
import { parseQuestionnaireDraft } from "@/lib/questionnaire-draft";
import type { AssessmentAnswers } from "@/lib/types";
import { cn } from "@/lib/utils";

type Answers = AssessmentAnswers;
type Choice<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

const steps = [
  {
    category: "Profil",
    title: "Quel niveau de précision souhaitez-vous ?",
    subtitle: "Vous pourrez toujours affiner vos réponses plus tard.",
    minutes: 4,
  },
  {
    category: "Transport",
    title: "Comment vous déplacez-vous principalement ?",
    subtitle: "Choisissez le mode qui structure votre quotidien.",
    minutes: 4,
  },
  {
    category: "Transport",
    title: "Quelle voiture utilisez-vous ?",
    subtitle: "Nous utilisons une moyenne française incluant la fabrication.",
    minutes: 3,
  },
  {
    category: "Transport",
    title: "Combien roulez-vous chaque année ?",
    subtitle:
      "Une estimation suffit — vous pourrez indiquer vos données réelles en mode précis.",
    minutes: 3,
  },
  {
    category: "Transport",
    title: "À quelle fréquence prenez-vous l’avion ?",
    subtitle: "Comptez des allers-retours sur une année habituelle.",
    minutes: 3,
  },
  {
    category: "Logement",
    title: "À quoi ressemble votre logement ?",
    subtitle:
      "La surface chauffée et le partage du logement changent fortement le résultat.",
    minutes: 2,
  },
  {
    category: "Logement",
    title: "Comment votre logement est-il chauffé ?",
    subtitle:
      "Si vous ne connaissez pas votre consommation, nous l’estimerons avec prudence.",
    minutes: 2,
  },
  {
    category: "Alimentation",
    title: "Quel régime décrit le mieux votre quotidien ?",
    subtitle: "Pensez à une semaine normale, pas à une semaine parfaite.",
    minutes: 2,
  },
  {
    category: "Alimentation",
    title: "À quelle fréquence mangez-vous du bœuf ?",
    subtitle:
      "C’est le détail alimentaire qui influence le plus souvent le résultat.",
    minutes: 1,
  },
  {
    category: "Achats",
    title: "Comment décririez-vous vos achats ?",
    subtitle: "Vêtements, électronique, mobilier et équipements sur une année.",
    minutes: 1,
  },
  {
    category: "Services",
    title: "Et vos services et usages numériques ?",
    subtitle:
      "Ils comptent, mais leur poids restera proportionné aux autres postes.",
    minutes: 1,
  },
] as const;

const chapters = [
  { label: "Profil", from: 0, to: 0 },
  { label: "Déplacements", from: 1, to: 4 },
  { label: "Logement", from: 5, to: 6 },
  { label: "Quotidien", from: 7, to: 10 },
] as const;

function OptionCard<T extends string | number>({
  choice,
  selected,
  onSelect,
  compact = false,
}: {
  choice: Choice<T>;
  selected: boolean;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  const Icon = choice.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(choice.value)}
      className={cn(
        "questionnaire-option group relative flex w-full items-center gap-4 rounded-2xl border bg-[var(--card)] text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        compact && "is-compact",
        compact ? "min-h-16 p-4" : "min-h-24 p-5",
        selected
          ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
          : "border-[var(--border)] hover:-translate-y-0.5 hover:border-[var(--muted-foreground)] hover:shadow-sm",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
            selected
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]",
          )}
        >
          <Icon size={20} strokeWidth={1.8} />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold sm:text-[15px]">
          {choice.label}
        </span>
        {choice.description && (
          <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
            {choice.description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "ml-auto grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--border)]",
        )}
      >
        <Check size={12} className={selected ? "opacity-100" : "opacity-0"} />
      </span>
    </button>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div className="questionnaire-range rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {hint && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {hint}
            </p>
          )}
        </div>
        <p className="number-tabular whitespace-nowrap text-2xl font-semibold tracking-[-.04em]">
          {value.toLocaleString("fr-FR")}{" "}
          <span className="text-sm font-normal text-[var(--muted-foreground)]">
            {unit}
          </span>
        </p>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-6 h-1.5 w-full cursor-pointer"
      />
      <div className="mt-2 flex justify-between font-mono text-[10px] text-[var(--muted-foreground)]">
        <span>{min.toLocaleString("fr-FR")}</span>
        <span>{max.toLocaleString("fr-FR")}</span>
      </div>
    </div>
  );
}

function Segment<T extends string | number>({
  value,
  options,
  onChange,
  active = true,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  active?: boolean;
}) {
  return (
    <div
      className="questionnaire-segment grid rounded-xl bg-[var(--surface)] p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((item) => (
        <button
          key={String(item.value)}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "min-h-10 rounded-[9px] px-2 text-xs font-semibold transition-all",
            active && value === item.value
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Questionnaire() {
  const router = useRouter();
  const startedAt = useRef<number | null>(null);
  const completed = useRef(false);
  const abandonmentTracked = useRef(false);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>(defaultAnswers);
  const [touchedSteps, setTouchedSteps] = useState<number[]>([]);
  const [estimatedSteps, setEstimatedSteps] = useState<number[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [saving, setSaving] = useState(false);
  const step = steps[index];
  const progress = ((index + 1) / steps.length) * 100;
  const chapterIndex = chapters.findIndex(
    (chapter) => index >= chapter.from && index <= chapter.to,
  );
  const chapter = chapters[Math.max(chapterIndex, 0)];
  const stepWasAnswered = touchedSteps.includes(index);
  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTouchedSteps((current) =>
      current.includes(index) ? current : [...current, index],
    );
    setEstimatedSteps((current) => current.filter((stepIndex) => stepIndex !== index));
  };
  useEffect(() => {
    startedAt.current = Date.now();
    trackCarbonEvent({ name: "Questionnaire démarré" });
    const trackAbandonment = () => {
      if (completed.current || abandonmentTracked.current) return;
      abandonmentTracked.current = true;
      const currentChapter = chapters.find(
        (item) =>
          indexRef.current >= item.from && indexRef.current <= item.to,
      );
      const chapterName: QuestionnaireChapter =
        currentChapter?.label === "Profil"
          ? "profil"
          : currentChapter?.label === "Déplacements"
            ? "deplacements"
            : currentChapter?.label === "Logement"
              ? "logement"
              : "quotidien";
      trackCarbonEvent({
        name: "Questionnaire abandonné",
        data: { chapitre: chapterName },
      });
    };
    window.addEventListener("pagehide", trackAbandonment);
    return () => window.removeEventListener("pagehide", trackAbandonment);
  }, []);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);
  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const draft = parseQuestionnaireDraft(
        localStorage.getItem(QUESTIONNAIRE_DRAFT_KEY),
        steps.length,
      );
      if (draft) {
        setAnswers(draft.answers);
        setIndex(draft.index);
        setTouchedSteps(draft.touchedSteps);
        setEstimatedSteps(draft.estimatedSteps);
        setResumed(draft.index > 0 || draft.touchedSteps.length > 0);
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);
  useEffect(() => {
    if (!draftReady || saving) return;
    localStorage.setItem(
      QUESTIONNAIRE_DRAFT_KEY,
      JSON.stringify({
        answers,
        index,
        touchedSteps,
        estimatedSteps,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [answers, draftReady, estimatedSteps, index, saving, touchedSteps]);
  useEffect(() => {
    if (!resumed) return;
    const resumedTimer = window.setTimeout(() => setResumed(false), 4_000);
    return () => window.clearTimeout(resumedTimer);
  }, [resumed]);
  const next = () => {
    if (!stepWasAnswered) {
      setEstimatedSteps((current) =>
        current.includes(index) ? current : [...current, index],
      );
    }
    if (index < steps.length - 1) {
      setDirection(1);
      setIndex(index + 1);
      window.scrollTo(0, 0);
    } else {
      setSaving(true);
      completed.current = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      localStorage.removeItem(QUESTIONNAIRE_DRAFT_KEY);
      const result = calculateAssessment(answers);
      const storedGoal = Number(localStorage.getItem(GOAL_STORAGE_KEY));
      const previousHistory = readLocalHistory();
      addLocalSnapshot(
        createAssessmentSnapshot({
          answers,
          result,
          goalKg: storedGoal >= 2000 ? storedGoal : 5000,
          source: "questionnaire",
        }),
      );
      trackCarbonEvent({
        name: "Questionnaire terminé",
        data: {
          mode: answers.mode === "quick" ? "rapide" : "précis",
          dureeSecondes: roundedDurationSeconds(
            startedAt.current ?? Date.now(),
          ),
        },
      });
      if (previousHistory.length === 1)
        trackCarbonEvent({
          name: "Second bilan réalisé",
          data: {
            delai: secondAssessmentDelay(previousHistory[0]!.createdAt),
          },
        });
      setTimeout(() => router.push("/resultat"), 450);
    }
  };
  const back = () => {
    if (index > 0) {
      setDirection(-1);
      setIndex(index - 1);
    } else {
      if (!abandonmentTracked.current) {
        abandonmentTracked.current = true;
        trackCarbonEvent({
          name: "Questionnaire abandonné",
          data: { chapitre: "profil" },
        });
      }
      router.push("/");
    }
  };

  const content = () => {
    switch (index) {
      case 0:
        return (
          <div className="grid gap-4 sm:grid-cols-2">
            <OptionCard
              selected={stepWasAnswered && answers.mode === "quick"}
              onSelect={(v) => update("mode", v)}
              choice={{
                value: "quick",
                label: "Mode rapide",
                description: "Environ 4 min · nous estimons les détails.",
                icon: Zap,
              }}
            />
            <OptionCard
              selected={stepWasAnswered && answers.mode === "precise"}
              onSelect={(v) => update("mode", v)}
              choice={{
                value: "precise",
                label: "Mode précis",
                description: "Environ 8 min · ajoutez vos données réelles.",
                icon: Gauge,
              }}
            />
            <div className="sm:col-span-2 mt-2 flex items-start gap-3 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted-foreground)]">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--positive)]"
              />
              <p>
                Aucune réponse ne quitte votre navigateur. Le compte ne sera
                proposé qu’après le résultat, pour une sauvegarde volontaire.
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["car", "Voiture", Car],
                ["train", "Train", TrainFront],
                ["bike", "Vélo", Bike],
                ["transit", "Transports publics", Bus],
                ["walk", "Marche", MapPin],
                ["motorcycle", "Moto", Waves],
              ] as const
            ).map(([value, label, icon]) => (
              <OptionCard
                compact
                key={value}
                selected={stepWasAnswered && answers.primaryMobility === value}
                onSelect={(v) => {
                  update("primaryMobility", v);
                  if (v !== "car") update("carType", "none");
                }}
                choice={{ value, label, icon }}
              />
            ))}
          </div>
        );
      case 2:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "none",
                  "Je n’ai pas de voiture",
                  "Les kilomètres seront mis à zéro.",
                  Bike,
                ],
                ["petrol", "Essence", "Voiture thermique moyenne.", Car],
                [
                  "diesel",
                  "Diesel",
                  "Voiture thermique moyenne en mode rapide.",
                  Car,
                ],
                ["hybrid", "Hybride", "Rechargeable ou non rechargeable.", Zap],
                [
                  "electric",
                  "Électrique",
                  "Mix électrique français, fabrication incluse.",
                  Zap,
                ],
              ] as const
            ).map(([value, label, description, icon]) => (
              <OptionCard
                compact
                key={value}
                selected={stepWasAnswered && answers.carType === value}
                onSelect={(v) => update("carType", v)}
                choice={{ value, label, description, icon }}
              />
            ))}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {answers.carType === "none" ? (
              <div className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--muted-foreground)]">
                    <Car size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Aucune distance en voiture
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Vous avez indiqué ne pas avoir de voiture. Ce poste restera
                      donc à zéro.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" onClick={back}>
                  Modifier ma réponse
                </Button>
              </div>
            ) : (
              <>
                <RangeField
                  label="Distance en voiture"
                  value={answers.carKm}
                  min={0}
                  max={40000}
                  step={500}
                  unit="km/an"
                  onChange={(v) => update("carKm", v)}
                  hint="La moyenne de votre compteur sur un an."
                />
                <RangeField
                  label="Nombre moyen de personnes"
                  value={answers.occupancy}
                  min={1}
                  max={4}
                  step={0.1}
                  unit="personne(s)"
                  onChange={(v) => update("occupancy", v)}
                  hint="Vous compris, sur l’ensemble des trajets."
                />
              </>
            )}
            <RangeField
              label="Distance en train"
              value={answers.trainKm}
              min={0}
              max={10000}
              step={100}
              unit="km/an"
              onChange={(v) => update("trainKm", v)}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <RangeField
              label="Allers-retours courts"
              value={answers.shortFlights}
              min={0}
              max={12}
              unit="/ an"
              onChange={(v) => update("shortFlights", v)}
              hint="France ou Europe, environ 600 km par trajet."
            />
            <RangeField
              label="Allers-retours long-courriers"
              value={answers.longFlights}
              min={0}
              max={6}
              unit="/ an"
              onChange={(v) => update("longFlights", v)}
              hint="Environ 7 000 km par trajet."
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard
                compact
                selected={stepWasAnswered && answers.homeType === "apartment"}
                onSelect={(v) => update("homeType", v)}
                choice={{
                  value: "apartment",
                  label: "Appartement",
                  icon: Building2,
                }}
              />
              <OptionCard
                compact
                selected={stepWasAnswered && answers.homeType === "house"}
                onSelect={(v) => update("homeType", v)}
                choice={{ value: "house", label: "Maison", icon: Home }}
              />
            </div>
            <RangeField
              label="Surface chauffée"
              value={answers.surface}
              min={15}
              max={300}
              step={5}
              unit="m²"
              onChange={(v) => update("surface", v)}
            />
            <RangeField
              label="Occupants du logement"
              value={answers.occupants}
              min={1}
              max={8}
              unit="personne(s)"
              onChange={(v) => update("occupants", v)}
            />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-sm font-semibold">Isolation estimée</p>
              <Segment
                active={stepWasAnswered}
                value={answers.insulation}
                onChange={(v) => update("insulation", v)}
                options={[
                  { value: "good", label: "Bonne" },
                  { value: "average", label: "Moyenne" },
                  { value: "poor", label: "Faible" },
                ]}
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["gas", "Gaz", Waves],
                  ["electric", "Électrique", Zap],
                  ["heatpump", "Pompe à chaleur", Sparkles],
                  ["fuel", "Fioul", Waves],
                  ["wood", "Bois", Leaf],
                  ["district", "Réseau de chaleur", Building2],
                ] as const
              ).map(([value, label, icon]) => (
                <OptionCard
                  compact
                  key={value}
                  selected={stepWasAnswered && answers.heating === value}
                  onSelect={(v) => update("heating", v)}
                  choice={{ value, label, icon }}
                />
              ))}
            </div>
            {answers.mode === "precise" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm font-semibold">
                  Chauffage total du logement{" "}
                  <span className="font-normal text-[var(--muted-foreground)]">
                    (optionnel)
                  </span>
                  <div className="mt-3 flex items-center rounded-xl bg-[var(--surface)] px-4">
                    <input
                      aria-describedby="heating-consumption-hint"
                      className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                      type="number"
                      min="0"
                      placeholder="8 000"
                      value={answers.heatingKwh ?? ""}
                      onChange={(e) =>
                        update(
                          "heatingKwh",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      kWh/an
                    </span>
                  </div>
                  <span
                    id="heating-consumption-hint"
                    className="mt-2 block text-[11px] font-normal leading-4 text-[var(--muted-foreground)]"
                  >
                    La valeur annuelle de la facture pour tout le foyer.
                  </span>
                </label>
                <label className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm font-semibold">
                  Électricité totale du logement{" "}
                  <span className="font-normal text-[var(--muted-foreground)]">
                    (optionnel)
                  </span>
                  <div className="mt-3 flex items-center rounded-xl bg-[var(--surface)] px-4">
                    <input
                      aria-describedby="electricity-consumption-hint"
                      className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                      type="number"
                      min="0"
                      placeholder="2 300"
                      value={answers.electricityKwh ?? ""}
                      onChange={(e) =>
                        update(
                          "electricityKwh",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      kWh/an
                    </span>
                  </div>
                  <span
                    id="electricity-consumption-hint"
                    className="mt-2 block text-[11px] font-normal leading-4 text-[var(--muted-foreground)]"
                  >
                    Hors chauffage si celui-ci est déjà saisi séparément.
                  </span>
                </label>
              </div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["vegan", "Vegan", "Aucun produit animal", Leaf],
                ["vegetarian", "Végétarien", "Sans viande ni poisson", Leaf],
                [
                  "flexitarian",
                  "Flexitarien",
                  "Viande occasionnelle",
                  Utensils,
                ],
                ["omnivore", "Omnivore", "Viande régulièrement", Utensils],
                [
                  "meat-heavy",
                  "Forte consommation",
                  "Viande presque chaque jour",
                  Utensils,
                ],
              ] as const
            ).map(([value, label, description, icon]) => (
              <OptionCard
                compact
                key={value}
                selected={stepWasAnswered && answers.diet === value}
                onSelect={(v) => update("diet", v)}
                choice={{ value, label, description, icon }}
              />
            ))}
          </div>
        );
      case 8:
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [0, "Jamais"],
                [0.5, "Rarement"],
                [1.5, "1–2× / semaine"],
                [4, "3–5× / semaine"],
                [7, "Tous les jours"],
              ] as const
            ).map(([value, label]) => (
              <OptionCard
                compact
                key={value}
                selected={stepWasAnswered && answers.beefFrequency === value}
                onSelect={(v) => update("beefFrequency", v)}
                choice={{ value, label, icon: value === 0 ? Leaf : Utensils }}
              />
            ))}
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["low", "Sobre", "Peu de neuf, réparation fréquente"],
                  ["standard", "Courant", "Quelques achats chaque mois"],
                  ["high", "Intense", "Renouvellements fréquents"],
                ] as const
              ).map(([value, label, description]) => (
                <OptionCard
                  compact
                  key={value}
                  selected={stepWasAnswered && answers.purchaseProfile === value}
                  onSelect={(v) => update("purchaseProfile", v)}
                  choice={{ value, label, description, icon: ShoppingBag }}
                />
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-sm font-semibold">Part de seconde main</p>
              <Segment
                active={stepWasAnswered}
                value={answers.secondHand}
                onChange={(v) => update("secondHand", v)}
                options={[
                  { value: "often", label: "Souvent" },
                  { value: "sometimes", label: "Parfois" },
                  { value: "never", label: "Jamais" },
                ]}
              />
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-sm font-semibold">
                Durée de vie du smartphone
              </p>
              <Segment
                active={stepWasAnswered}
                value={answers.deviceYears}
                onChange={(v) => update("deviceYears", v)}
                options={[
                  { value: 2, label: "≈ 2 ans" },
                  { value: 3, label: "3–4 ans" },
                  { value: 5, label: "5 ans +" },
                ]}
              />
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <RangeField
              label="Streaming & internet"
              value={answers.digitalHours}
              min={0}
              max={12}
              step={0.5}
              unit="h/jour"
              onChange={(v) => update("digitalHours", v)}
              hint="Vidéo, musique, cloud et réseaux sociaux."
            />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <p className="mb-4 text-sm font-semibold">
                Services, loisirs, banque & assurance
              </p>
              <Segment
                active={stepWasAnswered}
                value={answers.servicesProfile}
                onChange={(v) => update("servicesProfile", v)}
                options={[
                  { value: "low", label: "Peu" },
                  { value: "standard", label: "Moyen" },
                  { value: "high", label: "Beaucoup" },
                ]}
              />
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted-foreground)]">
              <Sparkles
                size={16}
                className="mt-0.5 shrink-0 text-[var(--accent)]"
              />
              <p>
                Le numérique est volontairement pondéré à son ordre de grandeur
                réel. Les services publics sont intégrés comme une part
                mutualisée et ne seront pas présentés comme un levier
                individuel.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="process-shell questionnaire-shell min-h-screen bg-[var(--background)]">
      <div className="questionnaire-ambient" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="metadata">
          <source src={CARBON_SIGNAL_VIDEO} type="video/mp4" />
        </video>
        <div />
      </div>
      <header className="questionnaire-header border-b border-[var(--border)]">
        <div className="questionnaire-header-inner mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <div className="questionnaire-status-pill hidden items-center gap-2 text-xs text-[var(--muted-foreground)] sm:flex">
              <Signal size={13} />
              Sauvegarde locale
              <span />
              <Clock3 size={13} /> {answers.mode === "precise" ? "≈ 8 min" : "≈ 4 min"}
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="questionnaire-progress h-0.5 bg-[var(--surface)]">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-[var(--accent)]"
            transition={{ duration: 0.35 }}
          />
        </div>
      </header>
      <div className="questionnaire-layout mx-auto grid min-h-[calc(100vh-75px)] max-w-[1240px] grid-rows-[1fr_auto] px-5 lg:px-8">
        <aside className="questionnaire-rail" aria-label="Contexte de l’étape">
          <div>
            <p className="questionnaire-system-label">
              <Activity size={13} /> Votre bilan
            </p>
            <p className="questionnaire-rail-number">
              {String(chapterIndex + 1).padStart(2, "0")}
            </p>
            <p className="questionnaire-rail-category">{chapter.label}</p>
          </div>
          <div className="questionnaire-step-map" aria-hidden="true">
            {chapters.map((_, currentChapterIndex) => (
              <span
                key={currentChapterIndex}
                className={
                  currentChapterIndex <= chapterIndex ? "is-complete" : undefined
                }
              />
            ))}
          </div>
          <div className="questionnaire-rail-note">
            <ShieldCheck size={15} />
            <p>Données privées. Calcul local. Synchronisation facultative.</p>
          </div>
        </aside>
        <div className="questionnaire-stage w-full py-10 sm:py-16 lg:py-20">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="eyebrow">
                {chapterIndex + 1} sur {chapters.length} — {chapter.label}
              </p>
            </div>
            <p className="number-tabular text-xs text-[var(--muted-foreground)]">
              {Math.round(progress)}%
            </p>
          </div>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="questionnaire-title balance text-3xl font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl">
                {step.title}
              </h1>
              <p className="mt-4 max-w-[620px] text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                {step.subtitle}
              </p>
              {resumed && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--positive-soft)] px-3 py-1.5 text-xs font-medium text-[var(--positive)]">
                  <Check size={13} /> Votre progression a été reprise automatiquement
                </p>
              )}
              <div className="questionnaire-content mt-9 sm:mt-11">
                {content()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="questionnaire-footer sticky bottom-0 -mx-5 border-t border-[var(--border)] bg-[color:var(--background)/.9] px-5 py-4 backdrop-blur-xl lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-[760px] items-center justify-between">
            <Button
              className="questionnaire-back"
              variant="ghost"
              onClick={back}
            >
              <span className="questionnaire-back-mark" aria-hidden="true">
                {index === 0 ? "N" : <ChevronLeft size={18} />}
              </span>
              {index === 0 ? "Quitter" : "Retour"}
            </Button>
            <div className="flex items-center gap-2">
              {!stepWasAnswered && index > 0 && (
                <Button
                  variant="ghost"
                  className="hidden text-xs sm:inline-flex"
                  onClick={next}
                >
                  Estimer pour moi
                </Button>
              )}
              <Button
                className="questionnaire-next"
                variant="accent"
                onClick={next}
                disabled={saving}
              >
                {saving
                  ? "Calcul en cours…"
                  : index === steps.length - 1
                    ? "Voir mon résultat"
                    : stepWasAnswered
                      ? "Continuer"
                      : index === 0
                        ? "Utiliser le mode rapide"
                        : "Estimer et continuer"}
                {!saving && <ArrowRight size={17} />}
              </Button>
            </div>
          </div>
        </footer>
      </div>
      <span className="sr-only" aria-live="polite">
        Étape {index + 1} sur {steps.length}, {chapter.label}
      </span>
    </main>
  );
}

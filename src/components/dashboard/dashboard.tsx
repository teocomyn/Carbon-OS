"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  Cloud,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  ExternalLink,
  Gauge,
  History,
  Home,
  Info,
  Layers3,
  Leaf,
  Menu,
  Plane,
  Repeat2,
  RefreshCw,
  RotateCcw,
  Share2,
  ShoppingBag,
  Sparkles,
  Target,
  TrainFront,
  Utensils,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  ACTION_PLAN_STORAGE_KEY,
  defaultAnswers,
  GOAL_STORAGE_KEY,
  STORAGE_KEY,
} from "@/data/defaults";
import { emissionFactors, factorById } from "@/data/emission-factors";
import { calculateAssessment } from "@/lib/calculator";
import {
  completedActionsSince,
  MAX_ACTIVE_ACTIONS,
  mergeActionPlans,
  normalizeActionPlan,
  parseActionPlan,
} from "@/lib/action-plan";
import { secondAssessmentDelay, trackCarbonEvent } from "@/lib/analytics";
import {
  addLocalSnapshot,
  calculateProgress,
  clearLocalHistory,
  createAssessmentSnapshot,
  mergeHistories,
  readLocalHistory,
  writeLocalHistory,
} from "@/lib/history";
import { buildScenarios } from "@/lib/recommendations";
import { CARBON_SIGNAL_VIDEO } from "@/lib/media";
import {
  buildProgressStory,
  recommendedAssessmentWindow,
} from "@/lib/progress-story";
import type {
  ActionPlanItem,
  ActionPlanStatus,
  AssessmentAnswers,
  AssessmentSnapshot,
  CalculationLine,
  EmissionCategory,
  Scenario,
} from "@/lib/types";
import { cn, formatKg, formatTons } from "@/lib/utils";

const categoryIcons: Record<
  EmissionCategory,
  React.ComponentType<{ size?: number }>
> = {
  transport: Plane,
  housing: Home,
  food: Utensils,
  purchases: ShoppingBag,
  services: Layers3,
};

function resolvePlanScenario(
  item: ActionPlanItem,
  current?: Scenario,
): Scenario {
  return {
    id: item.scenarioId,
    title: item.title ?? current?.title ?? "Action personnelle",
    description:
      item.description ??
      current?.description ??
      "Une action conservée dans votre historique personnel.",
    savingKg: item.estimatedSavingKg ?? current?.savingKg ?? 0,
    effort: item.effort ?? current?.effort ?? "Modéré",
    cost: item.cost ?? current?.cost ?? "Neutre",
    icon: current?.icon ?? "sparkles",
    rationale:
      item.rationale ??
      current?.rationale ??
      "Vous aviez choisi cette action comme un levier pertinent pour votre situation.",
  };
}

function enrichActionPlan(items: ActionPlanItem[], scenarios: Scenario[]) {
  return normalizeActionPlan(
    items.map((item) => {
      const scenario = scenarios.find(
        (candidate) => candidate.id === item.scenarioId,
      );
      if (!scenario) return item;
      return {
        ...item,
        title: item.title ?? scenario.title,
        description: item.description ?? scenario.description,
        estimatedSavingKg: item.estimatedSavingKg ?? scenario.savingKg,
        effort: item.effort ?? scenario.effort,
        cost: item.cost ?? scenario.cost,
        rationale: item.rationale ?? scenario.rationale,
      };
    }),
  );
}

type DashboardView = "today" | "act" | "progress" | "understand";

const navItems: {
  id: DashboardView;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: "today", label: "Aujourd’hui", icon: Home },
  { id: "act", label: "Agir", icon: Target },
  { id: "progress", label: "Mes progrès", icon: History },
  { id: "understand", label: "Comprendre", icon: CircleHelp },
];

type SyncStatus = "checking" | "local" | "syncing" | "synced" | "error";

async function syncHistoryWithCloud(
  history: AssessmentSnapshot[],
  goalKg: number,
  actionPlan: ActionPlanItem[],
  preferCloudGoal = false,
) {
  const cloudResponse = await fetch("/api/sync", {
    headers: { Accept: "application/json" },
  });
  if (cloudResponse.status === 401 || cloudResponse.status === 503) return null;
  if (!cloudResponse.ok) throw new Error("sync_read_failed");
  const cloud = (await cloudResponse.json()) as {
    configured: boolean;
    authenticated: boolean;
    history: AssessmentSnapshot[];
    goalKg: number | null;
    actionPlan: ActionPlanItem[];
  };
  if (!cloud.configured || !cloud.authenticated) return null;
  const merged = mergeHistories(history, cloud.history);
  const resolvedGoal =
    preferCloudGoal && cloud.goalKg && cloud.goalKg >= 2000
      ? cloud.goalKg
      : goalKg;

  const mergedPlan = mergeActionPlans(actionPlan, cloud.actionPlan ?? []);
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history: merged,
      goalKg: resolvedGoal,
      actionPlan: mergedPlan,
    }),
  });
  if (response.status === 401 || response.status === 503) return null;
  if (!response.ok) throw new Error("sync_failed");
  return (await response.json()) as {
    history: AssessmentSnapshot[];
    goalKg: number | null;
    actionPlan: ActionPlanItem[];
  };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ size?: number }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel p-5",
        accent && "border-[var(--accent)] bg-[var(--accent)] text-white",
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={cn(
            "text-xs font-medium",
            accent ? "text-white/65" : "text-[var(--muted-foreground)]",
          )}
        >
          {label}
        </p>
        <Icon size={16} />
      </div>
      <p className="number-tabular mt-6 text-2xl font-semibold tracking-[-.045em]">
        {value}
      </p>
      <p
        className={cn(
          "mt-1 text-xs",
          accent ? "text-white/65" : "text-[var(--muted-foreground)]",
        )}
      >
        {note}
      </p>
    </div>
  );
}

function CalculationDialog({
  line,
  trigger,
}: {
  line: CalculationLine;
  trigger: React.ReactNode;
}) {
  const factor = factorById[line.factorId];
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] max-h-[88vh] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl outline-none sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-[-.035em]">
                Calcul · {line.label}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
                Un résultat déterministe, inspectable et reproductible.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <div className="mt-8 rounded-2xl bg-[var(--background)] p-5 font-mono text-sm">
            <div className="flex justify-between gap-4">
              <span>
                {line.activity.toLocaleString("fr-FR", {
                  maximumFractionDigits: 1,
                })}{" "}
                {line.activityUnit}
              </span>
            </div>
            <div className="my-3 flex items-center gap-3 text-[var(--muted-foreground)]">
              <span>×</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <div className="flex justify-between gap-4">
              <span>
                {line.factorValue.toLocaleString("fr-FR", {
                  maximumFractionDigits: 6,
                })}
              </span>
              <span className="text-right text-[var(--muted-foreground)]">
                {line.factorUnit}
              </span>
            </div>
            <div className="my-3 h-px bg-[var(--border)]" />
            <div className="flex justify-between text-base font-bold">
              <span>=</span>
              <span>{formatKg(line.kgCo2e)} CO₂e/an</span>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted-foreground)]">
            {line.explanation}
          </p>
          <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-6 text-xs">
            <div>
              <dt className="text-[var(--muted-foreground)]">Source</dt>
              <dd className="mt-1 font-semibold">{factor.source}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Année</dt>
              <dd className="mt-1 font-semibold">{factor.year}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">
                Confiance facteur
              </dt>
              <dd className="mt-1 font-semibold capitalize">
                {factor.confidence}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">
                Nature de l’activité
              </dt>
              <dd className="mt-1 font-semibold">
                {line.estimated ? "Estimée" : "Déclarée / forfait officiel"}
              </dd>
            </div>
          </dl>
          <a
            href={factor.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Consulter la source <ExternalLink size={14} />
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CategoryBreakdown({
  category,
  total,
}: {
  category: ReturnType<typeof calculateAssessment>["categories"][number];
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const Icon = categoryIcons[category.category];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
      >
        <span
          className="grid size-11 place-items-center rounded-xl"
          style={{ background: `${category.color}18`, color: category.color }}
        >
          <Icon size={19} />
        </span>
        <span>
          <span className="block text-sm font-semibold">{category.label}</span>
          <span className="mt-2 block h-1.5 max-w-[360px] overflow-hidden rounded-full bg-[var(--surface)]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min((category.kgCo2e / total) * 220, 100)}%`,
                background: category.color,
              }}
            />
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-right">
            <span className="block text-base font-semibold">
              {formatKg(category.kgCo2e)}
            </span>
            <span className="block text-[10px] text-[var(--muted-foreground)]">
              {Math.round((category.kgCo2e / total) * 100)} %
            </span>
          </span>
          <ChevronDown
            size={16}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-5 py-3">
              {category.lines.map((line) => (
                <CalculationDialog
                  key={line.id}
                  line={line}
                  trigger={
                    <button className="group flex w-full items-center justify-between gap-4 rounded-xl px-2 py-3 text-left hover:bg-[var(--surface)]">
                      <span>
                        <span className="block text-sm font-medium">
                          {line.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                          {line.estimated
                            ? "Activité estimée"
                            : "Donnée déclarée"}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {formatKg(line.kgCo2e)}{" "}
                        <ChevronRight
                          size={14}
                          className="text-[var(--muted-foreground)]"
                        />
                      </span>
                    </button>
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScenarioCard({
  scenario,
  active,
  onToggle,
  planStatus,
  planFull,
  onAddToPlan,
}: {
  scenario: Scenario;
  active: boolean;
  onToggle: () => void;
  planStatus?: ActionPlanStatus;
  planFull: boolean;
  onAddToPlan: () => void;
}) {
  const icons: Record<string, React.ComponentType<{ size?: number }>> = {
    zap: Zap,
    plane: Plane,
    sprout: Leaf,
    home: Home,
    train: TrainFront,
    repeat: Repeat2,
    smartphone: Sparkles,
  };
  const Icon = icons[scenario.icon] ?? Sparkles;
  return (
    <div
      className={cn(
        "group flex w-full flex-col rounded-2xl border text-left transition-all",
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted-foreground)]",
      )}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)]",
          )}
        >
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{scenario.title}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
            {scenario.description}
          </span>
          <span className="mt-3 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-full bg-[var(--surface)] px-2 py-1">
              Effort {scenario.effort.toLowerCase()}
            </span>
            <span className="rounded-full bg-[var(--surface)] px-2 py-1">
              {scenario.cost}
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="block whitespace-nowrap text-sm font-bold text-[var(--positive)]">
            −{formatKg(scenario.savingKg)}
          </span>
          <span
            className={cn(
              "ml-auto mt-4 grid size-5 place-items-center rounded-full border",
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--border)]",
            )}
          >
            <Check size={12} className={active ? "opacity-100" : "opacity-0"} />
          </span>
        </span>
      </button>
      <div className="mx-5 border-t border-[var(--border)] py-4">
        <button
          type="button"
          onClick={onAddToPlan}
          disabled={Boolean(planStatus) || planFull}
          className="text-xs font-semibold text-[var(--accent)] disabled:text-[var(--muted-foreground)]"
        >
          {planStatus === "completed"
            ? "Action réalisée"
            : planStatus
              ? "Ajoutée à mon plan"
              : planFull
                ? "Plan complet · 3 actions"
                : "+ Ajouter à mon plan"}
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [answers, setAnswers] = useState<AssessmentAnswers>(defaultAnswers);
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("today");
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [goalKg, setGoalKg] = useState(5000);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState<AssessmentSnapshot[]>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("checking");
  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      let loadedAnswers = defaultAnswers;
      let loadedGoal = 5000;
      let hasLocalGoal = false;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          loadedAnswers = { ...defaultAnswers, ...JSON.parse(stored) };
          setAnswers(loadedAnswers);
        }
        const storedGoal = Number(localStorage.getItem(GOAL_STORAGE_KEY));
        if (storedGoal >= 2000) {
          hasLocalGoal = true;
          loadedGoal = storedGoal;
          setGoalKg(storedGoal);
        }
      } catch {}
      const requestedView = new URLSearchParams(window.location.search).get(
        "view",
      );
      if (
        requestedView === "today" ||
        requestedView === "act" ||
        requestedView === "progress" ||
        requestedView === "understand"
      ) {
        setActiveView(requestedView);
      }
      let loadedHistory = readLocalHistory();
      const loadedPlan = enrichActionPlan(
        parseActionPlan(localStorage.getItem(ACTION_PLAN_STORAGE_KEY)),
        buildScenarios(loadedAnswers),
      );
      localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify(loadedPlan));
      setActionPlan(loadedPlan);
      if (!loadedHistory.length && localStorage.getItem(STORAGE_KEY)) {
        loadedHistory = addLocalSnapshot(
          createAssessmentSnapshot({
            answers: loadedAnswers,
            result: calculateAssessment(loadedAnswers),
            goalKg: loadedGoal,
            source: "imported",
          }),
        );
      }
      setHistory(loadedHistory);
      setHydrated(true);
      setSyncStatus("syncing");
      syncHistoryWithCloud(loadedHistory, loadedGoal, loadedPlan, !hasLocalGoal)
        .then((cloud) => {
          if (!cloud) {
            setSyncStatus("local");
            return;
          }
          const merged = writeLocalHistory(
            mergeHistories(loadedHistory, cloud.history),
          );
          setHistory(merged);
          const mergedPlan = enrichActionPlan(
            mergeActionPlans(loadedPlan, cloud.actionPlan ?? []),
            buildScenarios(loadedAnswers),
          );
          setActionPlan(mergedPlan);
          localStorage.setItem(
            ACTION_PLAN_STORAGE_KEY,
            JSON.stringify(mergedPlan),
          );
          if (cloud.goalKg && cloud.goalKg >= 2000) {
            setGoalKg(cloud.goalKg);
            localStorage.setItem(GOAL_STORAGE_KEY, String(cloud.goalKg));
          }
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("error"));
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const feedbackTimer = window.setTimeout(() => setFeedback(""), 3200);
    return () => window.clearTimeout(feedbackTimer);
  }, [feedback]);
  const result = useMemo(() => calculateAssessment(answers), [answers]);
  const scenarios = useMemo(() => buildScenarios(answers), [answers]);
  const savingKg = scenarios
    .filter((s) => activeScenarios.includes(s.id))
    .reduce((sum, s) => sum + s.savingKg, 0);
  const simulatedKg = Math.max(result.totalKg - savingKg, 0);
  const topLines = result.categories
    .flatMap((c) => c.lines)
    .sort((a, b) => b.kgCo2e - a.kgCo2e)
    .slice(0, 5);
  const topAction = scenarios[0];
  const plannedActions = actionPlan.map((item) => ({
    item,
    scenario: resolvePlanScenario(
      item,
      scenarios.find((scenario) => scenario.id === item.scenarioId),
    ),
  }));
  const activePlannedActions = plannedActions.filter(
    ({ item }) => item.status !== "completed",
  );
  const completedPlannedActions = plannedActions.filter(
    ({ item }) => item.status === "completed",
  );
  const weeklyPriority = activePlannedActions[0]?.scenario ?? topAction;
  const progress = useMemo(() => calculateProgress(history), [history]);
  const progressStory = useMemo(() => buildProgressStory(history), [history]);
  const nextAssessmentWindow = progress.latest
    ? recommendedAssessmentWindow(progress.latest.createdAt)
    : null;
  const meaningfulCategoryChanges =
    progressStory?.categoryChanges
      .filter((category) => Math.abs(category.changeKg) >= 1)
      .slice(0, 3) ?? [];
  const completedSincePrevious = progressStory
    ? completedActionsSince(actionPlan, progressStory.previous.createdAt).map(
        (item) => ({
          item,
          scenario: resolvePlanScenario(
            item,
            scenarios.find((scenario) => scenario.id === item.scenarioId),
          ),
        }),
      )
    : [];
  const progressData = history.map((snapshot) => ({
    date: new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: history.length > 4 ? "2-digit" : undefined,
    }).format(new Date(snapshot.createdAt)),
    tonnes: Number((snapshot.result.totalKg / 1000).toFixed(2)),
  }));
  const confidenceLabel =
    result.confidenceScore >= 80
      ? "élevée"
      : result.confidenceScore >= 60
        ? "moyenne"
        : "à affiner";
  const changeView = (view: DashboardView) => {
    setActiveView(view);
    setMobileNav(false);
    window.history.replaceState(null, "", `/dashboard?view=${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleScenario = (id: string) =>
    setActiveScenarios((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTION_PLAN_STORAGE_KEY);
    setAnswers(defaultAnswers);
    setActionPlan([]);
    setActiveScenarios([]);
  };
  const deleteAllData = async () => {
    if (
      !window.confirm(
        syncStatus === "synced"
          ? "Supprimer les réponses, l’historique et l’objectif sur cet appareil et dans votre compte ?"
          : "Supprimer les réponses, l’historique et l’objectif de cet appareil ?",
      )
    )
      return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GOAL_STORAGE_KEY);
    localStorage.removeItem(ACTION_PLAN_STORAGE_KEY);
    clearLocalHistory();
    setAnswers(defaultAnswers);
    setGoalKg(5000);
    setHistory([]);
    setActionPlan([]);
    setActiveScenarios([]);
    if (syncStatus === "synced") {
      const response = await fetch("/api/sync", { method: "DELETE" });
      setFeedback(
        response.ok
          ? "Données locales et synchronisées supprimées"
          : "Données locales supprimées — suppression distante à réessayer",
      );
    } else {
      setFeedback("Données locales supprimées");
    }
  };
  const saveGoal = (value: number) => {
    setGoalKg(value);
    localStorage.setItem(GOAL_STORAGE_KEY, String(value));
    setGoalDialogOpen(false);
    setFeedback(`Objectif enregistré : ${formatTons(value)} t en 2030`);
    trackCarbonEvent({ name: "Objectif défini" });
    if (syncStatus === "synced") {
      setSyncStatus("syncing");
      syncHistoryWithCloud(history, value, actionPlan)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }
  };
  const saveCurrentAssessment = () => {
    const isSecondAssessment = history.length === 1;
    const updatedHistory = addLocalSnapshot(
      createAssessmentSnapshot({
        answers,
        result: calculateAssessment(answers),
        goalKg,
        source: "manual",
      }),
    );
    setHistory(updatedHistory);
    setFeedback("Nouveau point de progression enregistré");
    if (isSecondAssessment)
      trackCarbonEvent({
        name: "Second bilan réalisé",
        data: { delai: secondAssessmentDelay(history[0]!.createdAt) },
      });
    if (syncStatus === "synced") {
      setSyncStatus("syncing");
      syncHistoryWithCloud(updatedHistory, goalKg, actionPlan)
        .then((cloud) => {
          if (cloud) setHistory(writeLocalHistory(cloud.history));
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus("error"));
    }
  };
  const retrySync = () => {
    setSyncStatus("syncing");
    setFeedback("Nouvelle tentative de synchronisation…");
    syncHistoryWithCloud(history, goalKg, actionPlan)
      .then((cloud) => {
        if (!cloud) {
          setSyncStatus("local");
          setFeedback("Connectez-vous pour activer la synchronisation");
          return;
        }
        const merged = writeLocalHistory(
          mergeHistories(history, cloud.history),
        );
        setHistory(merged);
        const mergedPlan = enrichActionPlan(
          mergeActionPlans(actionPlan, cloud.actionPlan ?? []),
          scenarios,
        );
        setActionPlan(mergedPlan);
        localStorage.setItem(
          ACTION_PLAN_STORAGE_KEY,
          JSON.stringify(mergedPlan),
        );
        if (cloud.goalKg && cloud.goalKg >= 2000) {
          setGoalKg(cloud.goalKg);
          localStorage.setItem(GOAL_STORAGE_KEY, String(cloud.goalKg));
        }
        setSyncStatus("synced");
        setFeedback("Synchronisation terminée");
      })
      .catch(() => {
        setSyncStatus("error");
        setFeedback(
          "La synchronisation reste indisponible. Vos données locales sont conservées.",
        );
      });
  };
  const persistPlan = (nextPlan: ActionPlanItem[]) => {
    const normalized = normalizeActionPlan(nextPlan);
    setActionPlan(normalized);
    localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify(normalized));
    if (syncStatus === "synced") {
      setSyncStatus("syncing");
      syncHistoryWithCloud(history, goalKg, normalized)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }
  };
  const addToPlan = (scenario: Scenario) => {
    if (
      actionPlan.some((item) => item.scenarioId === scenario.id) ||
      activePlannedActions.length >= MAX_ACTIVE_ACTIONS
    )
      return;
    const now = new Date().toISOString();
    persistPlan([
      ...actionPlan,
      {
        scenarioId: scenario.id,
        status: "to_try",
        startedAt: null,
        completedAt: null,
        addedAt: now,
        updatedAt: now,
        title: scenario.title,
        description: scenario.description,
        estimatedSavingKg: scenario.savingKg,
        effort: scenario.effort,
        cost: scenario.cost,
        rationale: scenario.rationale,
      },
    ]);
    setFeedback("Action ajoutée à votre plan");
    trackCarbonEvent({
      name: "Action sélectionnée",
      data: { action: scenario.id },
    });
  };
  const updatePlanItem = (
    scenarioId: string,
    changes: Partial<
      Pick<ActionPlanItem, "status" | "startedAt" | "completedAt">
    >,
  ) => {
    persistPlan(
      actionPlan.map((item) =>
        item.scenarioId === scenarioId
          ? { ...item, ...changes, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };
  const changePlanStatus = (item: ActionPlanItem, status: ActionPlanStatus) => {
    if (
      item.status === "completed" &&
      status !== "completed" &&
      activePlannedActions.length >= MAX_ACTIVE_ACTIONS
    ) {
      setFeedback("Votre plan actif contient déjà trois actions");
      return;
    }
    const now = new Date().toISOString();
    updatePlanItem(item.scenarioId, {
      status,
      startedAt:
        status === "in_progress"
          ? (item.startedAt ?? now.slice(0, 10))
          : item.startedAt,
      completedAt: status === "completed" ? (item.completedAt ?? now) : null,
    });
    setFeedback(
      status === "completed"
        ? "Action marquée comme réalisée"
        : status === "in_progress"
          ? "Action passée en cours"
          : "Action remise dans À essayer",
    );
  };
  const removeFromPlan = (scenarioId: string) => {
    persistPlan(actionPlan.filter((item) => item.scenarioId !== scenarioId));
    setFeedback("Action retirée du plan");
  };
  const exportData = () => {
    downloadJson("carbon-os-bilan-2026.json", {
      exportedAt: new Date().toISOString(),
      answers,
      result,
      goal: { targetKg: goalKg, year: 2030 },
      history,
      actionPlan,
    });
    setFeedback("Bilan exporté au format JSON");
  };
  const exportPlan = () => {
    downloadJson("carbon-os-plan-action-2026.json", {
      exportedAt: new Date().toISOString(),
      currentKg: result.totalKg,
      targetKg: goalKg,
      targetYear: 2030,
      actions: plannedActions,
    });
    setFeedback("Plan d’action exporté au format JSON");
  };
  const shareAssessment = async () => {
    const shareData = {
      title: "Mon bilan Carbon OS",
      text: `Mon empreinte estimée est de ${formatTons(result.totalKg)} t CO₂e/an. Découvrez la vôtre avec Carbon OS.`,
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setFeedback("Bilan partagé");
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`,
        );
        setFeedback("Lien et résumé copiés");
      }
    } catch {
      setFeedback("Partage annulé");
    }
  };

  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="text-center">
          <Logo />
          <div className="mx-auto mt-8 size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        </div>
      </main>
    );
  return (
    <div className="process-shell dashboard-shell min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-[var(--border)] bg-[var(--card)] p-5 lg:flex lg:flex-col">
        <div className="px-2 py-2">
          <Logo />
        </div>
        <nav className="mt-12 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => changeView(item.id)}
              aria-current={activeView === item.id ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activeView === item.id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
              )}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold">Votre prochaine étape</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
            Choisissez une première action réaliste et mesurez son effet.
          </p>
          <button
            onClick={() => changeView("act")}
            className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-[var(--accent)]"
          >
            Voir mes actions <ArrowRight size={13} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] px-2 pt-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <RotateCcw size={13} /> Réinitialiser
          </button>
          <ThemeToggle />
        </div>
        <Link
          href="/compte"
          className="mt-4 flex items-center justify-between rounded-xl px-2 py-2 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          <span className="flex items-center gap-2">
            <Cloud size={14} />
            {syncStatus === "synced"
              ? "Synchronisé"
              : syncStatus === "syncing" || syncStatus === "checking"
                ? "Synchronisation…"
                : "Données locales"}
          </span>
          <ChevronRight size={13} />
        </Link>
      </aside>
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--background)/.86] backdrop-blur-xl lg:ml-[248px]">
        <div className="flex h-[68px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label={mobileNav ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileNav}
            >
              <Menu size={19} />
            </Button>
            <Logo compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">Bilan personnel · 2026</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Calcul local · données privées
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
            >
              <Link href="/compte" aria-label="Compte et synchronisation">
                <UserRound size={17} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              aria-label="Partager mon bilan"
              onClick={shareAssessment}
            >
              <Share2 size={17} />
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/questionnaire">Mettre à jour</Link>
            </Button>
          </div>
        </div>
        {mobileNav && (
          <nav className="grid grid-cols-2 gap-1 border-t border-[var(--border)] p-3 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  changeView(item.id);
                }}
                aria-current={activeView === item.id ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs",
                  activeView === item.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface)]",
                )}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>
      <p className="sr-only" aria-live="polite">
        {feedback}
      </p>
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed right-4 top-20 z-[70] rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs font-semibold shadow-lg"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
      <main className="lg:ml-[248px]">
        <div className="mx-auto max-w-[1180px] px-5 py-8 lg:px-8 lg:py-12">
          <section
            id="overview"
            className={cn("scroll-mt-24", activeView !== "today" && "hidden")}
          >
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Aujourd’hui</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
                  Bonjour, voici ce qui compte.
                </h1>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                <span className="size-1.5 rounded-full bg-[var(--positive)]" />{" "}
                Calcul à jour
              </div>
            </div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <div className="dashboard-signal-card panel relative overflow-hidden p-6 sm:p-8">
                <div className="dashboard-signal-media" aria-hidden="true">
                  <video autoPlay muted loop playsInline preload="metadata">
                    <source src={CARBON_SIGNAL_VIDEO} type="video/mp4" />
                  </video>
                  <span />
                </div>
                <div className="absolute right-0 top-0 size-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-[var(--accent-soft)] blur-3xl" />
                <div className="relative grid items-center gap-8 sm:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Empreinte annuelle estimée
                      </p>
                      <span className="dashboard-live-code">
                        Fiabilité {confidenceLabel}
                      </span>
                    </div>
                    <p className="number-tabular mt-3 text-[clamp(4.8rem,10vw,7.5rem)] font-semibold leading-none tracking-[-.085em]">
                      {formatTons(result.totalKg)}
                    </p>
                    <p className="mt-3 text-sm font-medium">tonnes CO₂e / an</p>
                    <div className="mt-7 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs">
                        ≈ {Math.round(result.totalKg / 365)} kg / jour
                      </span>
                      <span className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs">
                        Fourchette indicative {formatTons(result.lowKg)}–
                        {formatTons(result.highKg)} t
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-[210px]"
                    aria-label={`Graphique de répartition : ${result.categories.map((c) => `${c.label} ${Math.round((c.kgCo2e / result.totalKg) * 100)} %`).join(", ")}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={result.categories}
                          dataKey="kgCo2e"
                          nameKey="label"
                          innerRadius={68}
                          outerRadius={92}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {result.categories.map((c) => (
                            <Cell key={c.category} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatKg(Number(value))}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none relative -top-[126px] text-center">
                      <p className="text-xl font-semibold">
                        {result.confidenceScore}%
                      </p>
                      <p className="text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">
                        qualité
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="panel flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      Votre priorité cette semaine
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {activePlannedActions.length
                        ? `${activePlannedActions.length} action${activePlannedActions.length > 1 ? "s" : ""} active${activePlannedActions.length > 1 ? "s" : ""}`
                        : "Meilleur potentiel actuel"}
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-xl bg-[var(--positive-soft)] text-[var(--positive)]">
                    <ArrowDown size={17} />
                  </span>
                </div>
                {weeklyPriority && (
                  <>
                    <h2 className="mt-10 text-2xl font-semibold leading-tight tracking-[-.035em]">
                      {weeklyPriority.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                      {weeklyPriority.description}
                    </p>
                    <div className="mt-auto pt-8">
                      <p className="text-3xl font-semibold tracking-[-.05em] text-[var(--positive)]">
                        Environ {formatKg(weeklyPriority.savingKg)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        potentiellement évités par an
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-5 w-full"
                        onClick={() => changeView("act")}
                      >
                        {activePlannedActions.length
                          ? "Voir mon plan"
                          : "Choisir une action"}
                        <ArrowRight size={15} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Fourchette indicative"
                value={`${formatTons(result.lowKg)}–${formatTons(result.highKg)} t`}
                note="Selon l’incertitude des activités"
                icon={Gauge}
              />
              <MetricCard
                label="Potentiel identifié"
                value={`−${formatTons(scenarios.reduce((s, x) => s + x.savingKg, 0))} t`}
                note="Leviers non cumulés mécaniquement"
                icon={Target}
              />
              <MetricCard
                label="Objectif long terme"
                value="2,0 t"
                note="Trajectoire neutralité 2050"
                icon={Leaf}
                accent
              />
            </div>
          </section>

          <section
            id="progress"
            className={cn(
              "scroll-mt-24",
              activeView !== "progress" && "hidden",
            )}
          >
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Suivre</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                  Votre progression, bilan après bilan.
                </h2>
                <p className="mt-3 max-w-[620px] text-sm leading-6 text-[var(--muted-foreground)]">
                  Chaque nouveau calcul crée un point daté. Le suivi reste dans
                  ce navigateur sans compte et se fusionne si vous activez la
                  synchronisation.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/compte">
                    <Cloud size={15} />
                    {syncStatus === "synced"
                      ? "Compte synchronisé"
                      : "Synchroniser"}
                  </Link>
                </Button>
                <Button variant="accent" onClick={saveCurrentAssessment}>
                  Enregistrer ce bilan
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
              <div className="panel overflow-hidden p-6 sm:p-8">
                {progressStory ? (
                  <>
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                      <div>
                        <p className="eyebrow">
                          Depuis le{" "}
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                          }).format(new Date(progressStory.previous.createdAt))}
                        </p>
                        <h3 className="mt-4 max-w-[720px] text-3xl font-semibold leading-tight tracking-[-.045em] sm:text-4xl">
                          {progressStory.changeKg < -1
                            ? `Votre empreinte a diminué de ${formatKg(Math.abs(progressStory.changeKg))}.`
                            : progressStory.changeKg > 1
                              ? `Votre empreinte a augmenté de ${formatKg(progressStory.changeKg)}.`
                              : "Votre empreinte est restée stable."}
                        </h3>
                        <p className="mt-4 max-w-[720px] text-sm leading-6 text-[var(--muted-foreground)]">
                          {progressStory.primaryCategory &&
                            Math.abs(progressStory.primaryCategory.changeKg) >=
                              1 && (
                              <>
                                La principale évolution vient du poste «{" "}
                                {progressStory.primaryCategory.label} » (
                                {progressStory.primaryCategory.changeKg < 0
                                  ? "−"
                                  : "+"}
                                {formatKg(
                                  Math.abs(
                                    progressStory.primaryCategory.changeKg,
                                  ),
                                )}
                                ).{" "}
                              </>
                            )}
                          {progressStory.changeKg > 1
                            ? "Ce n’est pas un échec : ce bilan rend le changement visible et vous aide à choisir la prochaine action utile."
                            : progressStory.changeKg < -1
                              ? "C’est une évolution encourageante. Continuez avec une action réaliste à la fois."
                              : "Cette stabilité constitue un point de repère fiable pour la suite."}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-2xl",
                          progressStory.changeKg <= 0
                            ? "bg-[var(--positive-soft)] text-[var(--positive)]"
                            : "bg-[var(--surface)] text-[var(--muted-foreground)]",
                        )}
                      >
                        <ArrowDown
                          size={21}
                          className={
                            progressStory.changeKg > 0
                              ? "rotate-180"
                              : undefined
                          }
                        />
                      </span>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[var(--surface)] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted-foreground)]">
                          Bilan précédent
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                          {formatTons(progressStory.previous.result.totalKg)} t
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[var(--accent-soft)] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--accent)]">
                          Dernier bilan
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                          {formatTons(progressStory.latest.result.totalKg)} t
                        </p>
                      </div>
                    </div>

                    {meaningfulCategoryChanges.length > 0 && (
                      <div className="mt-8 border-t border-[var(--border)] pt-6">
                        <p className="text-xs font-semibold">
                          Ce qui a le plus évolué
                        </p>
                        <div className="mt-4 space-y-3">
                          {meaningfulCategoryChanges.map((category) => (
                            <div
                              key={category.category}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <span className="text-[var(--muted-foreground)]">
                                {category.label}
                              </span>
                              <span
                                className={cn(
                                  "font-semibold",
                                  category.changeKg < 0 &&
                                    "text-[var(--positive)]",
                                )}
                              >
                                {category.changeKg < 0 ? "−" : "+"}
                                {formatKg(Math.abs(category.changeKg))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 border-t border-[var(--border)] pt-6">
                      <p className="text-xs font-semibold">
                        Actions réalisées depuis le bilan précédent
                      </p>
                      {completedSincePrevious.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {completedSincePrevious.map(({ item, scenario }) => (
                            <span
                              key={item.scenarioId}
                              className="inline-flex items-center gap-2 rounded-full bg-[var(--positive-soft)] px-3 py-1.5 text-xs font-medium text-[var(--positive)]"
                            >
                              <Check size={12} /> {scenario.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                          Quand vous terminerez une action, elle apparaîtra ici
                          pour relier vos efforts à votre progression.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[260px] flex-col justify-between">
                    <div>
                      <p className="eyebrow">Votre point de départ</p>
                      <h3 className="mt-4 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">
                        Votre histoire commence avec ce bilan.
                      </h3>
                      <p className="mt-4 max-w-[650px] text-sm leading-6 text-[var(--muted-foreground)]">
                        Il n’y a encore rien à comparer, et c’est normal. Votre
                        prochain bilan permettra d’expliquer précisément ce qui
                        a évolué, catégorie par catégorie.
                      </p>
                    </div>
                    {progress.latest && (
                      <p className="mt-8 text-2xl font-semibold tracking-[-.04em] text-[var(--accent)]">
                        Point de départ ·{" "}
                        {formatTons(progress.latest.result.totalKg)} t CO₂e/an
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="panel flex flex-col p-6 sm:p-8">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <CalendarDays size={19} />
                </span>
                <p className="mt-8 text-sm font-semibold">
                  Prochain bilan conseillé
                </p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-.035em]">
                  {nextAssessmentWindow
                    ? `Entre ${new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(nextAssessmentWindow.start))} et ${new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(nextAssessmentWindow.end))}`
                    : "Dans trois à six mois"}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                  Ce délai laisse le temps aux habitudes de changer sans vous
                  demander de suivre chaque détail au quotidien.
                </p>
                <Button asChild variant="secondary" className="mt-auto">
                  <Link href="/questionnaire">
                    Refaire mon bilan <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              <MetricCard
                label="Bilans enregistrés"
                value={String(history.length)}
                note={
                  history.length > 1 ? "Points comparables" : "Point de départ"
                }
                icon={History}
              />
              <MetricCard
                label="Depuis le bilan précédent"
                value={
                  progressStory
                    ? Math.abs(progressStory.changeKg) < 1
                      ? "Stable"
                      : `${progressStory.changeKg < 0 ? "−" : "+"}${formatKg(Math.abs(progressStory.changeKg))}`
                    : "—"
                }
                note={
                  progressStory
                    ? Math.abs(progressStory.changeKg) < 1
                      ? "Variation inférieure à 1 kg"
                      : `${Math.abs(progressStory.changePercent).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % ${progressStory.changeKg < 0 ? "de réduction" : "d’augmentation"}`
                    : "Un second bilan permettra la comparaison"
                }
                icon={ArrowDown}
                accent={Boolean(progressStory && progressStory.changeKg < 0)}
              />
              <MetricCard
                label="Meilleur bilan"
                value={
                  progress.best
                    ? `${formatTons(progress.best.result.totalKg)} t`
                    : "—"
                }
                note={
                  progress.best
                    ? new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "medium",
                      }).format(new Date(progress.best.createdAt))
                    : "Aucune donnée"
                }
                icon={Target}
              />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
              <div className="panel p-5 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      Empreinte dans le temps
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Tonnes CO₂e par an
                    </p>
                  </div>
                  {syncStatus === "error" ? (
                    <button
                      type="button"
                      onClick={retrySync}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-semibold text-[var(--accent)] transition-opacity hover:opacity-80"
                    >
                      <RefreshCw size={11} /> Réessayer la synchronisation
                    </button>
                  ) : (
                    <span className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                      {syncStatus === "synced"
                        ? "Cloud chiffré en transit"
                        : syncStatus === "syncing" || syncStatus === "checking"
                          ? "Synchronisation…"
                          : "Stockage local"}
                    </span>
                  )}
                </div>
                <div
                  className="mt-7 h-[260px]"
                  aria-label="Courbe de progression carbone"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={progressData}
                      margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, "auto"]}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString("fr-FR")} t`,
                          "Empreinte",
                        ]}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="tonnes"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel overflow-hidden">
                <div className="border-b border-[var(--border)] p-5 sm:p-6">
                  <p className="text-sm font-semibold">Historique récent</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Jusqu’à 50 bilans conservés
                  </p>
                </div>
                <div>
                  {[...history]
                    .reverse()
                    .slice(0, 5)
                    .map((snapshot, index) => (
                      <div
                        key={snapshot.id}
                        className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 last:border-0 sm:px-6"
                      >
                        <div>
                          <p className="text-xs font-semibold">
                            {index === 0 ? "Dernier bilan" : "Bilan précédent"}
                          </p>
                          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                            {new Intl.DateTimeFormat("fr-FR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(snapshot.createdAt))}
                          </p>
                        </div>
                        <p className="text-lg font-semibold tracking-[-.04em]">
                          {formatTons(snapshot.result.totalKg)} t
                        </p>
                      </div>
                    ))}
                  {!history.length && (
                    <p className="p-6 text-sm leading-6 text-[var(--muted-foreground)]">
                      Votre premier bilan apparaîtra ici après le questionnaire.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section
            id="emissions"
            className={cn(
              "scroll-mt-24",
              activeView !== "understand" && "hidden",
            )}
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Comprendre</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                  D’où viennent vos émissions ?
                </h2>
              </div>
              <p className="hidden max-w-[340px] text-right text-xs leading-5 text-[var(--muted-foreground)] sm:block">
                Cliquez sur une catégorie, puis sur une activité, pour inspecter
                chaque calcul.
              </p>
            </div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_.72fr]">
              <div className="space-y-3">
                {[...result.categories]
                  .sort((a, b) => b.kgCo2e - a.kgCo2e)
                  .map((category) => (
                    <CategoryBreakdown
                      key={category.category}
                      category={category}
                      total={result.totalKg}
                    />
                  ))}
              </div>
              <div className="space-y-5">
                <div className="panel p-6">
                  <p className="text-sm font-semibold">
                    Vos 5 plus gros postes
                  </p>
                  <div className="mt-5 space-y-1">
                    {topLines.map((line, index) => (
                      <CalculationDialog
                        key={line.id}
                        line={line}
                        trigger={
                          <button className="grid w-full grid-cols-[26px_1fr_auto] items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-[var(--surface)]">
                            <span className="font-mono text-xs text-[var(--muted-foreground)]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium">
                              {line.label}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatKg(line.kgCo2e)}
                            </span>
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="panel p-6">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Vous situer</p>
                    <CircleHelp
                      size={14}
                      className="text-[var(--muted-foreground)]"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
                    Comparaison limitée à des périmètres de consommation
                    cohérents. Les méthodologies incompatibles ne sont pas
                    affichées.
                  </p>
                  <div className="mt-6 space-y-5">
                    {[
                      {
                        label: "Vous",
                        kg: result.totalKg,
                        color: "var(--accent)",
                      },
                      {
                        label: "France",
                        kg: 8200,
                        color: "var(--muted-foreground)",
                      },
                      {
                        label: "Trajectoire 2050",
                        kg: 2000,
                        color: "var(--positive)",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="font-medium">{item.label}</span>
                          <span className="font-semibold">
                            {formatTons(item.kg)} t
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((item.kg / Math.max(result.totalKg, 8200)) * 100, 100)}%`,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 border-t border-[var(--border)] pt-4 text-[10px] leading-4 text-[var(--muted-foreground)]">
                    France : 8,2 t CO₂e/personne/an, ADEME 2025–2026. Cible 2 t
                    : trajectoire neutralité carbone à long terme.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="simulator"
            className={cn("scroll-mt-24", activeView !== "act" && "hidden")}
          >
            <div>
              <p className="eyebrow">Décider</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                Choisissez jusqu’à trois actions.
              </h2>
              <p className="mt-3 max-w-[590px] text-sm leading-6 text-[var(--muted-foreground)]">
                Commencez par ce qui vous semble réaliste. Votre estimation se
                met à jour immédiatement.
              </p>
            </div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_.72fr]">
              <div className="grid gap-3 md:grid-cols-2">
                {scenarios.slice(0, 6).map((s) => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    active={activeScenarios.includes(s.id)}
                    onToggle={() => toggleScenario(s.id)}
                    planStatus={
                      actionPlan.find((item) => item.scenarioId === s.id)
                        ?.status
                    }
                    planFull={activePlannedActions.length >= MAX_ACTIVE_ACTIONS}
                    onAddToPlan={() => addToPlan(s)}
                  />
                ))}
              </div>
              <div className="xl:sticky xl:top-24 xl:self-start">
                <div className="overflow-hidden rounded-[24px] bg-[#111218] p-6 text-white sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[.12em] text-white/45">
                    Nouveau scénario
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs text-white/45">Aujourd’hui</p>
                      <p className="number-tabular mt-2 text-3xl font-semibold tracking-[-.05em]">
                        {formatTons(result.totalKg)} t
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/45">Avec ces actions</p>
                      <p className="number-tabular mt-2 text-3xl font-semibold tracking-[-.05em] text-[#8fefcf]">
                        {formatTons(simulatedKg)} t
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      animate={{
                        width: `${(simulatedKg / result.totalKg) * 100}%`,
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-[#286f53] to-[#62d7b5]"
                    />
                  </div>
                  <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-6">
                    <div>
                      <p className="text-xs text-white/45">
                        Économie potentielle
                      </p>
                      <p className="mt-2 text-3xl font-semibold tracking-[-.05em] text-[#8fefcf]">
                        −{formatKg(savingKg)}
                      </p>
                    </div>
                    <span className="text-sm text-white/50">
                      −{Math.round((savingKg / result.totalKg) * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveScenarios([])}
                    className="mt-6 text-xs text-white/45 hover:text-white"
                  >
                    Réinitialiser le scénario
                  </button>
                </div>
                <div className="mt-3 flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-5 text-[var(--muted-foreground)]">
                  <Info size={15} className="mt-0.5 shrink-0" />
                  <p>
                    Les économies peuvent se chevaucher. Pour une trajectoire
                    consolidée, priorisez les actions une par une.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="actions"
            className={cn(
              "scroll-mt-24 pt-20",
              activeView !== "act" && "hidden",
            )}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Réduire</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                  Donnez-vous un cap simple.
                </h2>
              </div>
              <Button variant="secondary" onClick={exportPlan}>
                <Download size={15} /> Exporter le plan
              </Button>
            </div>
            <div className="mt-7 panel p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold">Mon plan personnel</p>
                  <p className="mt-2 max-w-[600px] text-sm leading-6 text-[var(--muted-foreground)]">
                    Trois actions actives maximum pour rester concentré. Les
                    actions réalisées restent dans votre historique sans bloquer
                    la suite.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold">
                  {activePlannedActions.length} / {MAX_ACTIVE_ACTIONS} actives
                </span>
              </div>
              {completedPlannedActions.length > 0 && (
                <p className="mt-4 text-xs text-[var(--muted-foreground)]">
                  {completedPlannedActions.length} action
                  {completedPlannedActions.length > 1 ? "s" : ""} réalisée
                  {completedPlannedActions.length > 1 ? "s" : ""} conservée
                  {completedPlannedActions.length > 1 ? "s" : ""} dans votre
                  historique.
                </p>
              )}
              {plannedActions.length ? (
                <div className="divide-y divide-[var(--border)]">
                  {[...activePlannedActions, ...completedPlannedActions].map(
                    ({ item, scenario }) => (
                      <article
                        key={scenario.id}
                        className="grid gap-5 py-7 lg:grid-cols-[1fr_230px]"
                      >
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold tracking-[-.025em]">
                              {scenario.title}
                            </h3>
                            <span className="text-sm font-semibold text-[var(--positive)]">
                              −{formatKg(scenario.savingKg)} / an
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">
                              Effort {scenario.effort.toLowerCase()}
                            </span>
                            <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">
                              Budget · {scenario.cost.toLowerCase()}
                            </span>
                          </div>
                          <details className="group mt-5 text-sm">
                            <summary className="cursor-pointer list-none font-semibold text-[var(--accent)]">
                              Pourquoi cette action pour vous ?
                            </summary>
                            <p className="mt-2 max-w-[700px] leading-6 text-[var(--muted-foreground)]">
                              {scenario.rationale}
                            </p>
                          </details>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                            État
                            <select
                              value={item.status}
                              onChange={(event) =>
                                changePlanStatus(
                                  item,
                                  event.target.value as ActionPlanStatus,
                                )
                              }
                              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm font-semibold outline-none focus:border-[var(--accent)]"
                            >
                              <option value="to_try">À essayer</option>
                              <option value="in_progress">En cours</option>
                              <option value="completed">Réalisée</option>
                            </select>
                          </label>
                          <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={12} /> Date de début
                              facultative
                            </span>
                            <input
                              type="date"
                              value={item.startedAt ?? ""}
                              onChange={(event) =>
                                updatePlanItem(scenario.id, {
                                  startedAt: event.target.value || null,
                                })
                              }
                              className="mt-1.5 h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                            />
                          </label>
                          {item.completedAt && (
                            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--positive)]">
                              <Check size={12} /> Réalisée le{" "}
                              {new Intl.DateTimeFormat("fr-FR", {
                                dateStyle: "medium",
                              }).format(new Date(item.completedAt))}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFromPlan(scenario.id)}
                            className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            {item.status === "completed"
                              ? "Supprimer de l’historique"
                              : "Retirer du plan"}
                          </button>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold">
                    Votre plan est encore vide.
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Ajoutez une première action depuis les recommandations
                    ci-dessus.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 panel p-6 sm:p-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold">Objectif personnel</p>
                  <h3 className="mt-4 text-3xl font-semibold tracking-[-.05em]">
                    De {formatTons(result.totalKg)} t à {formatTons(goalKg)} t
                    en 2030
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Une trajectoire progressive construite à partir de vos
                    meilleurs leviers.
                  </p>
                </div>
                <Dialog.Root
                  open={goalDialogOpen}
                  onOpenChange={setGoalDialogOpen}
                >
                  <Dialog.Trigger asChild>
                    <Button variant="accent">
                      Définir mon objectif <ArrowRight size={15} />
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl outline-none sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Dialog.Title className="text-2xl font-semibold tracking-[-.035em]">
                            Votre objectif 2030
                          </Dialog.Title>
                          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                            Choisissez une cible ambitieuse mais réaliste. Elle
                            reste locale sans compte et se synchronise si vous
                            l’avez activé.
                          </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Fermer"
                          >
                            <X size={18} />
                          </Button>
                        </Dialog.Close>
                      </div>
                      <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        {[5000, 3500, 2000].map((target) => (
                          <button
                            key={target}
                            type="button"
                            disabled={target >= result.totalKg}
                            onClick={() => saveGoal(target)}
                            className={cn(
                              "rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                              goalKg === target
                                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                : "border-[var(--border)] hover:bg-[var(--surface)]",
                            )}
                          >
                            <span className="block text-2xl font-semibold tracking-[-.05em]">
                              {formatTons(target)} t
                            </span>
                            <span className="mt-2 block text-[10px] text-[var(--muted-foreground)]">
                              {target === 2000
                                ? "Trajectoire long terme"
                                : target === 3500
                                  ? "Ambitieux"
                                  : "Progressif"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
              <div className="mt-10 grid grid-cols-5 gap-2 border-t border-[var(--border)] pt-8">
                {[2026, 2027, 2028, 2029, 2030].map((year, i) => {
                  const value =
                    result.totalKg - (result.totalKg - goalKg) * (i / 4);
                  return (
                    <div key={year} className="relative text-center">
                      <div className="mx-auto mb-3 size-2.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" />
                      <p className="text-xs font-semibold">
                        {formatTons(value)} t
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                        {year}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="methodology"
            className={cn(
              "scroll-mt-24 pb-24 pt-20",
              activeView !== "understand" && "hidden",
            )}
          >
            <div>
              <p className="eyebrow">Transparence</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
                Méthode & sources
              </h2>
              <p className="mt-3 max-w-[650px] text-sm leading-6 text-[var(--muted-foreground)]">
                Cette V1 applique une méthode simple : activité annuelle ×
                facteur d’émission = kg CO₂e. Les facteurs sont séparés du code
                métier et le bilan conserve leur version.
              </p>
            </div>
            <div className="mt-7 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
              <div className="panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Fiabilité du résultat</p>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-bold text-[var(--accent)]">
                    {confidenceLabel}
                  </span>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <p className="text-4xl font-semibold capitalize tracking-[-.06em]">
                    {confidenceLabel}
                  </p>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${result.confidenceScore}%` }}
                  />
                </div>
                <p className="mt-3 text-[10px] leading-4 text-[var(--muted-foreground)]">
                  Cette indication dépend de la part de données réelles que vous
                  avez renseignées. Le pourcentage technique reste disponible
                  dans l’export de vos données.
                </p>
                <ul className="mt-6 space-y-3 text-xs text-[var(--muted-foreground)]">
                  <li className="flex gap-2">
                    <Check size={14} className="text-[var(--positive)]" />{" "}
                    Facteurs carbone officiels ou reconnus
                  </li>
                  <li className="flex gap-2">
                    <Check size={14} className="text-[var(--positive)]" />{" "}
                    Activités estimées clairement signalées
                  </li>
                  <li className="flex gap-2">
                    <Check size={14} className="text-[var(--positive)]" />{" "}
                    Version du modèle conservée
                  </li>
                </ul>
                <Button asChild variant="secondary" className="mt-7 w-full">
                  <Link href="/questionnaire">
                    Ajouter des données précises
                  </Link>
                </Button>
              </div>
              <div className="panel overflow-hidden">
                <div className="border-b border-[var(--border)] p-6">
                  <p className="text-sm font-semibold">Sources du calcul</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {emissionFactors.length} facteurs · version{" "}
                    {result.factorVersion}
                  </p>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {emissionFactors.map((f) => (
                    <a
                      key={f.id}
                      href={f.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--border)] px-6 py-4 last:border-0 hover:bg-[var(--surface)]"
                    >
                      <span>
                        <span className="block text-xs font-semibold">
                          {f.label}
                        </span>
                        <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">
                          {f.source} · {f.year} · confiance {f.confidence}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-mono text-xs">
                          {f.value.toLocaleString("fr-FR", {
                            maximumFractionDigits: 6,
                          })}
                        </span>
                        <span className="text-[9px] text-[var(--muted-foreground)]">
                          {f.unit}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl bg-[var(--surface)] p-5 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center">
              <p>
                {syncStatus === "synced"
                  ? "Vos réponses et votre historique sont synchronisés avec votre compte."
                  : "Vos réponses et votre historique restent dans ce navigateur. Aucun compte n’est requis."}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={exportData}
                  className="font-semibold text-[var(--foreground)] hover:underline"
                >
                  Exporter mes données
                </button>
                <button
                  onClick={deleteAllData}
                  className="font-semibold text-[var(--foreground)] hover:underline"
                >
                  Supprimer mes données
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

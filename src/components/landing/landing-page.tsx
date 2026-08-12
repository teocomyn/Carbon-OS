"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BarChart3, Calculator, Check, ChevronRight, LockKeyhole, Play, Sparkles, Target } from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

const steps = [
  { n: "01", title: "Mesurer", text: "Un parcours intelligent qui s’adapte à ce que vous savez réellement." },
  { n: "02", title: "Comprendre", text: "Chaque tonne est reliée à une activité, un facteur et une source." },
  { n: "03", title: "Réduire", text: "Les décisions sont classées par impact, coût et difficulté." },
  { n: "04", title: "Suivre", text: "Une trajectoire personnelle, lisible année après année." },
];

const categories = [
  { name: "Transport", value: "2,7 t", pct: "32%", color: "#7568ff" },
  { name: "Logement", value: "1,8 t", pct: "22%", color: "#ff9f66" },
  { name: "Alimentation", value: "1,7 t", pct: "20%", color: "#ef6cae" },
  { name: "Achats", value: "1,3 t", pct: "15%", color: "#43b9c5" },
  { name: "Services", value: "0,9 t", pct: "11%", color: "#8b95a7" },
];

export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <SiteHeader />
      <section className="noise relative pt-[148px] lg:pt-[176px]">
        <div className="absolute left-1/2 top-0 h-[620px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_64%)] opacity-60 blur-3xl" />
        <div className="relative mx-auto max-w-[1240px] px-5 lg:px-8">
          <div className="mx-auto max-w-[900px] text-center">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--card)/.65] px-3.5 py-2 text-xs text-[var(--muted-foreground)] backdrop-blur"><Sparkles size={13} className="text-[var(--accent)]" /> Votre tableau de bord carbone personnel</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="balance text-[clamp(3.2rem,8vw,6.8rem)] font-semibold leading-[.94] tracking-[-.075em]">Le véritable coût carbone de <span className="text-[var(--muted-foreground)]">votre vie.</span></motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="balance mx-auto mt-7 max-w-[650px] text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">Calculez votre empreinte en quelques minutes. Découvrez ce qui compte vraiment et les décisions qui peuvent réellement la réduire.</motion.p>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent" className="w-full sm:w-auto"><Link href="/questionnaire">Calculer mon empreinte <ArrowRight size={17} /></Link></Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto"><Link href="#experience"><Play size={15} fill="currentColor" /> Voir comment ça marche</Link></Button>
            </motion.div>
            <p className="mt-5 text-xs text-[var(--muted-foreground)]">≈ 4 minutes&nbsp;&nbsp;·&nbsp;&nbsp;Gratuit&nbsp;&nbsp;·&nbsp;&nbsp;Aucun compte requis</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .32, duration: .7 }} className="mt-20 lg:mt-24"><HeroVisual /></motion.div>
        </div>
      </section>

      <section id="experience" className="mx-auto max-w-[1240px] px-5 py-28 lg:px-8 lg:py-40">
        <div className="max-w-[720px]"><p className="eyebrow">Une donnée qui devient une décision</p><h2 className="balance mt-5 text-4xl font-semibold leading-[1.05] tracking-[-.055em] sm:text-6xl">Vous n’avez pas besoin de 30 conseils. Vous avez besoin des <span className="text-[var(--muted-foreground)]">3 bons.</span></h2></div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[26px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => <div key={step.n} className="group min-h-[250px] bg-[var(--card)] p-7 transition-colors hover:bg-[var(--surface)]"><span className="font-mono text-xs text-[var(--accent)]">{step.n}</span><h3 className="mt-20 text-2xl font-semibold tracking-tight">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{step.text}</p></div>)}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)] py-28 lg:py-36">
        <div className="mx-auto grid max-w-[1240px] gap-16 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start"><p className="eyebrow">Votre empreinte, expliquée</p><h2 className="balance mt-5 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Pas un score opaque. Un modèle que vous pouvez inspecter.</h2><p className="mt-6 max-w-[480px] leading-7 text-[var(--muted-foreground)]">Chaque résultat relie une activité réelle à un facteur d’émission daté, sourcé et versionné. Les estimations restent clairement identifiées.</p><Button asChild variant="secondary" className="mt-8"><Link href="/questionnaire">Explorer le calcul <ChevronRight size={16} /></Link></Button></div>
          <div className="panel p-5 sm:p-8">
            <div className="flex items-end justify-between border-b border-[var(--border)] pb-7"><div><p className="eyebrow">Répartition</p><p className="mt-3 text-4xl font-semibold tracking-[-.05em]">8,4 t <span className="text-base font-normal text-[var(--muted-foreground)]">CO₂e/an</span></p></div><div className="rounded-full bg-[var(--positive-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--positive)]">Confiance 82 %</div></div>
            <div className="mt-6 space-y-1">{categories.map((item) => <div key={item.name} className="group grid grid-cols-[110px_1fr_56px] items-center gap-4 rounded-xl px-2 py-3 hover:bg-[var(--surface)]"><div className="flex items-center gap-2.5 text-sm font-medium"><span className="size-2 rounded-full" style={{ background: item.color }} />{item.name}</div><div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]"><div className="h-full rounded-full" style={{ width: item.pct, background: item.color }} /></div><div className="text-right"><p className="text-sm font-semibold">{item.value}</p><p className="text-[10px] text-[var(--muted-foreground)]">{item.pct}</p></div></div>)}</div>
            <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Voir le calcul · Voiture</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">Donnée déclarée × facteur officiel</p></div><Calculator size={18} className="text-[var(--accent)]" /></div><div className="mt-5 grid grid-cols-[1fr_auto] gap-y-2 font-mono text-xs"><span>12 000 km ÷ 1,4 occupant</span><span>8 571 km</span><span>× 0,142 kg CO₂e/km</span><span>1 219 kg</span><span className="col-span-2 mt-2 border-t border-[var(--border)] pt-3 text-right font-bold">= 1,22 t CO₂e/an</span></div></div>
          </div>
        </div>
      </section>

      <section id="method" className="mx-auto max-w-[1240px] px-5 py-28 lg:px-8 lg:py-40">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="panel p-7 lg:col-span-2"><div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Target size={20}/></div><h3 className="mt-10 text-3xl font-semibold tracking-[-.04em]">Prioriser l’impact, pas la culpabilité.</h3><p className="mt-4 max-w-[600px] leading-7 text-[var(--muted-foreground)]">Le moteur compare les tonnes évitées, le coût, l’effort et la pertinence. Les gestes symboliques ne passent jamais devant les décisions structurelles.</p><div className="mt-10 grid gap-3 sm:grid-cols-3">{[["-1,3 t","Impact annuel"],["Faible","Difficulté"],["Économie","Coût estimé"]].map(([value,label])=><div key={label} className="rounded-2xl bg-[var(--surface)] p-5"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{label}</p></div>)}</div></article>
          <article id="privacy" className="panel flex flex-col p-7"><div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--positive-soft)] text-[var(--positive)]"><LockKeyhole size={20}/></div><h3 className="mt-10 text-2xl font-semibold tracking-tight">Privé par défaut.</h3><p className="mt-4 leading-7 text-[var(--muted-foreground)]">Votre bilan reste dans votre navigateur. Aucun compte, aucun profil public, aucune donnée vendue.</p><ul className="mt-auto space-y-3 pt-10 text-sm">{["Calcul anonyme","Export et suppression","Consentement explicite"].map(x=><li key={x} className="flex items-center gap-2"><Check size={15} className="text-[var(--positive)]" />{x}</li>)}</ul></article>
        </div>
      </section>

      <section className="px-5 pb-8 lg:px-8"><div className="noise relative mx-auto max-w-[1240px] overflow-hidden rounded-[34px] bg-[#111218] px-6 py-20 text-center text-white sm:px-12 lg:py-28"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(117,104,255,.42),transparent_55%)]"/><div className="relative"><BarChart3 className="mx-auto text-[#8f84ff]" size={28}/><h2 className="balance mx-auto mt-6 max-w-[760px] text-4xl font-semibold tracking-[-.055em] sm:text-6xl">On ne réduit bien que ce que l’on comprend vraiment.</h2><p className="mx-auto mt-5 max-w-[520px] text-white/60">Votre premier bilan prend environ quatre minutes. Il pourrait changer vos décisions pour les prochaines années.</p><Button asChild size="lg" className="mt-9 bg-white text-black hover:bg-white/90"><Link href="/questionnaire">Découvrir mon empreinte <ArrowRight size={17}/></Link></Button></div></div></section>
      <footer className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-5 py-10 text-xs text-[var(--muted-foreground)] sm:flex-row lg:px-8"><p>© 2026 Carbon OS · Prototype fonctionnel</p><p>Données ADEME · Impact CO₂ · Nos Gestes Climat</p></footer>
    </main>
  );
}

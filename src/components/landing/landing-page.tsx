"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Database,
  Leaf,
  ShieldCheck,
  Sigma,
  X,
} from "lucide-react";
import { HeroVisual } from "@/components/landing/hero-visual";
import { SkipLink } from "@/components/skip-link";
import { CARBON_SIGNAL_VIDEO } from "@/lib/media";
import { trackCarbonEvent } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { label: "Accueil", href: "/", active: true },
  { label: "Produit", href: "#produit" },
  { label: "Méthode", href: "/methodologie" },
  { label: "Confidentialité", href: "/confidentialite" },
];

const stats = [
  {
    symbol: "≈",
    target: 4,
    suffix: " min",
    decimals: 0,
    label: "Premier bilan",
  },
  {
    symbol: "○",
    target: 0,
    suffix: " compte",
    decimals: 0,
    label: "Pour commencer",
  },
  {
    symbol: "◎",
    target: 100,
    suffix: "%",
    decimals: 0,
    label: "Local par défaut",
  },
  {
    symbol: "#",
    target: 30,
    suffix: "",
    decimals: 0,
    label: "Facteurs versionnés",
  },
];

function CarbonMark() {
  return (
    <span className="landing-mark" aria-hidden="true">
      <span />
    </span>
  );
}

function CountUp({
  target,
  suffix,
  decimals,
  delay,
}: {
  target: number;
  suffix: string;
  decimals: number;
  delay: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(() => setValue(target), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }
    let frame = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (time: number) => {
        if (!start) start = time;
        const progress = Math.min((time - start) / 1500, 1);
        const eased = 1 - (1 - progress) ** 3;
        setValue(target * eased);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [delay, target]);

  return (
    <>
      {value.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const accountLabel = isSupabaseConfigured()
    ? "Mon compte"
    : "Synchronisation";

  useEffect(() => {
    trackCarbonEvent({ name: "Accueil consulté" });
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };
    document.body.classList.toggle("landing-menu-open", menuOpen);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      document.body.classList.remove("landing-menu-open");
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <>
    <SkipLink href="#landing-title" />
    <main className="landing-shell">
      <div className="landing-media" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="metadata">
          <source src={CARBON_SIGNAL_VIDEO} type="video/mp4" />
        </video>
        <div className="landing-video-wash" />
        <div className="landing-video-grain" />
      </div>

      <div className="landing-page">
        <header className="landing-header">
          <Link
            href="/"
            className="landing-logo"
            aria-label="Carbon OS — Accueil"
          >
            <CarbonMark />
          </Link>

          <nav className="landing-nav" aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={item.active ? "is-active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link href="/compte" className="landing-account">
            {accountLabel}
          </Link>

          <button
            type="button"
            className={`landing-burger ${menuOpen ? "is-open" : ""}`}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? (
              <X size={19} />
            ) : (
              <span aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        </header>

        {menuOpen && (
          <div className="landing-menu-layer">
            <button
              type="button"
              className="landing-menu-overlay"
              aria-label="Fermer le menu"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="landing-menu" aria-label="Navigation mobile">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={item.active ? "is-active" : undefined}
                  style={{ "--menu-index": index } as React.CSSProperties}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/compte"
                className="landing-menu-account"
                onClick={() => setMenuOpen(false)}
              >
                {accountLabel} <ArrowUpRight size={16} />
              </Link>
            </nav>
          </div>
        )}

        <section className="landing-hero" aria-labelledby="landing-title">
          <div
            className="landing-trust landing-anim"
            style={{ "--delay": ".05s" } as React.CSSProperties}
          >
            <div className="landing-trust-icons" aria-hidden="true">
              <span>
                <Leaf size={14} />
              </span>
              <span>
                <Database size={14} />
              </span>
              <span>
                <Sigma size={14} />
              </span>
            </div>
            <p>Sources publiques : ADEME, Impact CO₂, NGC</p>
          </div>

          <h1 id="landing-title" className="landing-headline">
            <span>Votre empreinte.</span>
            <span>Enfin compréhensible.</span>
          </h1>

          <p
            className="landing-subhead landing-anim"
            style={{ "--delay": ".28s" } as React.CSSProperties}
          >
            Estimez votre empreinte en 4 minutes. Découvrez ce qui pèse vraiment
            et les trois actions les plus utiles, sans compte obligatoire.
          </p>

          <Link
            href="/questionnaire"
            onClick={() => trackCarbonEvent({ name: "CTA bilan cliqué" })}
            className="landing-cta landing-anim"
            style={{ "--delay": ".4s" } as React.CSSProperties}
          >
            Faire mon bilan · 4 min <ArrowUpRight size={16} />
          </Link>

          <div
            className="landing-privacy landing-anim"
            style={{ "--delay": ".46s" } as React.CSSProperties}
          >
            <ShieldCheck size={13} /> Gratuit · privé par défaut · aucun compte
            requis
          </div>
        </section>

        <section className="landing-stats" aria-label="Chiffres clés Carbon OS">
          {stats.map((stat, index) => (
            <article
              key={stat.label}
              className="landing-stat landing-anim"
              style={
                { "--delay": `${0.5 + index * 0.08}s` } as React.CSSProperties
              }
            >
              <span className="landing-stat-symbol" aria-hidden="true">
                {stat.symbol}
              </span>
              <div>
                <p className="landing-stat-value">
                  <CountUp
                    target={stat.target}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    delay={480 + index * 90}
                  />
                </p>
                <p className="landing-stat-label">{stat.label}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
    <section id="produit" className="landing-follow" aria-labelledby="produit-title">
      <div className="landing-follow-inner">
        <p className="eyebrow">Le parcours</p>
        <h2 id="produit-title">Mesurer. Comprendre. Agir.</h2>
        <p className="landing-follow-lead">
          Carbon OS transforme un chiffre en trois actions réalistes. Le calcul
          reste dans votre navigateur. Le compte n’est proposé qu’après.
        </p>
        <div className="landing-follow-steps">
          {[
            {
              title: "Mesurer",
              text: "Quatre minutes en mode rapide, ou vos kWh et kilomètres en mode précis.",
            },
            {
              title: "Comprendre",
              text: "Cinq postes, une fourchette, et chaque ligne reliée à un facteur versionné.",
            },
            {
              title: "Agir",
              text: "Un plan limité à trois actions. Sans classement, sans badge, sans culpabilité.",
            },
          ].map((step, index) => (
            <article key={step.title}>
              <p>0{index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <div className="landing-follow-preview">
          <HeroVisual />
        </div>
        <div className="landing-follow-faq">
          <h3>Questions fréquentes</h3>
          <dl>
            <div>
              <dt>Est-ce un bilan carbone officiel ?</dt>
              <dd>
                Non. C’est une estimation pédagogique pour prioriser des
                actions, pas un audit réglementaire.
              </dd>
            </div>
            <div>
              <dt>Faut-il un compte ?</dt>
              <dd>
                Non. Questionnaire, résultat et historique fonctionnent sans
                compte, sur cet appareil.
              </dd>
            </div>
            <div>
              <dt>D’où viennent les chiffres ?</dt>
              <dd>
                Facteurs publics ADEME / Impact CO₂, Agribalyse et Nos Gestes
                Climat, figés et inspectables dans la méthodologie.
              </dd>
            </div>
          </dl>
        </div>
        <Link
          href="/questionnaire"
          onClick={() => trackCarbonEvent({ name: "CTA bilan cliqué" })}
          className="landing-follow-cta"
        >
          Faire mon bilan · 4 min <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
    </>
  );
}

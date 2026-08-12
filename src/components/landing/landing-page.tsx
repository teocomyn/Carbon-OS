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

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4";

const navItems = [
  { label: "Accueil", href: "/", active: true },
  { label: "Produit", href: "/dashboard" },
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
    symbol: "#",
    target: 27,
    suffix: "",
    decimals: 0,
    label: "Facteurs sourcés",
  },
  { symbol: "◎", target: 5, suffix: "", decimals: 0, label: "Catégories clés" },
  {
    symbol: "%",
    target: 100,
    suffix: "%",
    decimals: 0,
    label: "Calcul inspectable",
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
    <main className="landing-shell">
      <div className="landing-media" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="metadata">
          <source src={VIDEO_URL} type="video/mp4" />
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
            Mon compte
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
                Mon compte <ArrowUpRight size={16} />
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
            <p>Sourcé par l’ADEME, Impact CO₂ et NGC</p>
          </div>

          <h1 id="landing-title" className="landing-headline">
            <span>Votre empreinte.</span>
            <span>Enfin compréhensible.</span>
          </h1>

          <p
            className="landing-subhead landing-anim"
            style={{ "--delay": ".28s" } as React.CSSProperties}
          >
            Mesurez le coût carbone de votre quotidien. Identifiez les décisions
            qui comptent vraiment et suivez vos progrès, sans compte
            obligatoire.
          </p>

          <Link
            href="/questionnaire"
            className="landing-cta landing-anim"
            style={{ "--delay": ".4s" } as React.CSSProperties}
          >
            Calculer mon empreinte <ArrowUpRight size={16} />
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

      <a
        href="https://www.onlinewebfonts.com/fonts"
        className="landing-font-credit"
        target="_blank"
        rel="noreferrer"
      >
        Font via OnlineWebFonts
      </a>
    </main>
  );
}

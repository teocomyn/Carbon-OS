"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center px-5 text-center">
        <div className="max-w-[460px]">
          <p className="eyebrow">Incident local</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-.04em]">
            L’interface a rencontré un problème.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Vos réponses restent dans ce navigateur. Rechargez la page ou
            recommencez le bilan.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]"
              onClick={() => this.setState({ failed: false })}
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold"
            >
              Accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }
}

"use client";

import { IncidentScreen } from "@/components/incident-screen";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <IncidentScreen onRetry={reset} />
      </body>
    </html>
  );
}

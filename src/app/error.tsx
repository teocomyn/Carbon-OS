"use client";

import { IncidentScreen } from "@/components/incident-screen";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <IncidentScreen onRetry={reset} />;
}

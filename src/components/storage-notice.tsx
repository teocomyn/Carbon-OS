"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  hasStorageIssue,
  subscribeStorageIssues,
  writeBrowserStorage,
  removeBrowserStorage,
} from "@/lib/browser-storage";

export function StorageNotice() {
  const unavailable = useSyncExternalStore(
    subscribeStorageIssues,
    hasStorageIssue,
    () => false,
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const key = "carbon-os-storage-probe";
      if (writeBrowserStorage(key, "1")) removeBrowserStorage(key);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (!unavailable) return null;
  return (
    <p
      role="status"
      className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--foreground)]"
    >
      La sauvegarde locale est bloquée ou saturée. Vous pouvez faire votre
      bilan, mais vos dernières modifications peuvent être perdues après un
      rechargement. Exportez-le depuis le tableau de bord pour le garder.
    </p>
  );
}

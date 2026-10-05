"use client";

import { useEffect, useState } from "react";

export function StorageNotice() {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const key = "carbon-os-storage-probe";
        window.localStorage.setItem(key, "1");
        window.localStorage.removeItem(key);
      } catch {
        setUnavailable(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (!unavailable) return null;
  return (
    <p
      role="status"
      className="my-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--foreground)]"
    >
      Votre navigateur ne permet pas la sauvegarde locale. Vous pouvez faire
      votre bilan, mais il ne sera pas conservé après un rechargement.
      Exportez-le depuis le tableau de bord pour le garder.
    </p>
  );
}

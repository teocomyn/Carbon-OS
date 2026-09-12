"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(mountTimer);
  }, []);

  return (
    <Button
      aria-label={
        mounted && resolvedTheme === "dark"
          ? "Passer au thème clair"
          : "Passer au thème sombre"
      }
      aria-pressed={mounted ? resolvedTheme === "dark" : undefined}
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={17} className="dark:hidden" />
      <Sun size={17} className="hidden dark:block" />
    </Button>
  );
}

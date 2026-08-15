import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./a11y",
  testMatch: "**/*.playwright.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3001",
    browserName: "chromium",
    colorScheme: "dark",
    locale: "fr-FR",
    contextOptions: { reducedMotion: "reduce" },
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
